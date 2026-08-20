<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Receipt;
use App\Services\AccountingService;
use App\Services\DocumentNumberService;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PosController extends Controller
{
    /**
     * POS Checkout: สร้างใบแจ้งหนี้ + รับเงิน + ตัดสต็อก + ลงบัญชี ทั้งหมดใน transaction เดียว
     */
    public function checkout(Request $request)
    {
        $data = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'partner_id' => 'nullable|exists:partners,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'vat_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,bank,transfer',
            'amount_paid' => 'required|numeric|min:0',
            'reference' => 'nullable|string|max:255',
        ]);

        $vatRate = $data['vat_rate'] ?? 7;
        $discount = $data['discount'] ?? 0;
        $today = now()->toDateString();

        return DB::transaction(function () use ($data, $vatRate, $discount, $today) {
            // ── 1. Check stock ──
            $lines = array_map(fn ($item) => [
                'product_id' => $item['product_id'],
                'qty' => $item['qty'],
            ], $data['items']);
            StockService::assertStockEnough($lines, $data['warehouse_id'] ?? null);

            // ── 2. Create Invoice ──
            $invoice = Invoice::create([
                'type' => 'sale',
                'number' => DocumentNumberService::next('INV', $today),
                'partner_id' => $data['partner_id'] ?? null,
                'date' => $today,
                'status' => 'issued',
                'discount_amount' => $discount,
                'vat_rate' => $vatRate,
                'note' => 'POS',
                'created_by' => auth()->id(),
            ]);

            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $amount = round($item['qty'] * $item['unit_price'], 2);
                $subtotal += $amount;
                $invoice->items()->create([
                    'product_id' => $item['product_id'],
                    'qty' => $item['qty'],
                    'unit_price' => $item['unit_price'],
                    'vat_rate' => $vatRate,
                    'amount' => $amount,
                ]);
            }

            $vatAmount = round(($subtotal - $discount) * $vatRate / 100, 2);
            $total = round($subtotal - $discount + $vatAmount, 2);
            $invoice->update([
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $total,
                'net_payable' => $total,
            ]);

            // ── 3. Post accounting for invoice ──
            AccountingService::postInvoice($invoice);

            // ── 4. Stock movements ──
            foreach ($data['items'] as $item) {
                $product = \App\Models\Product::find($item['product_id']);
                $cost = StockService::averageCost($product, $data['warehouse_id'] ?? null) ?: $product->purchase_price;
                StockService::move(
                    $product,
                    -$item['qty'],
                    'out',
                    'invoice',
                    $invoice->id,
                    $data['warehouse_id'] ?? null,
                    $cost,
                    $today,
                    "POS - {$invoice->number}",
                    auth()->id()
                );
            }

            // ── 5. Create Payment ──
            $payment = Payment::create([
                'type' => 'in',
                'number' => DocumentNumberService::next('RC', $today),
                'partner_id' => $data['partner_id'] ?? null,
                'invoice_id' => $invoice->id,
                'date' => $today,
                'amount' => $data['amount_paid'],
                'wht_amount' => 0,
                'method' => $data['payment_method'],
                'reference' => $data['reference'] ?? null,
                'note' => 'POS',
                'created_by' => auth()->id(),
            ]);

            // ── 6. Post accounting for payment ──
            AccountingService::postPayment($payment);

            // ── 7. Update invoice paid status ──
            $invoice->update(['paid_amount' => $data['amount_paid'], 'status' => 'paid']);

            // ── 8. Create Receipt ──
            $receipt = Receipt::create([
                'number' => DocumentNumberService::next('RCT', $today),
                'payment_id' => $payment->id,
                'partner_id' => $data['partner_id'] ?? null,
                'date' => $today,
                'amount' => $total,
                'created_by' => auth()->id(),
            ]);

            // ── 9. Reload and return ──
            $invoice->load(['partner', 'items.product', 'creator']);

            return response()->json([
                'message' => 'POS checkout สำเร็จ',
                'invoice' => $invoice,
                'payment' => $payment->only(['id', 'number', 'amount', 'method']),
                'receipt' => $receipt->only(['id', 'number']),
                'change' => max(0, $data['amount_paid'] - $total),
            ], 201);
        });
    }

    /**
     * ดึงสินค้าสำหรับ POS (เฉพาะที่มีสต็อก)
     */
    public function products(Request $request)
    {
        $products = \App\Models\Product::query()
            ->when($request->category_id, fn ($q, $id) => $q->where('category_id', $id))
            ->when($request->search, fn ($q, $s) => $q->where('name_th', 'like', "%{$s}%")
                ->orWhere('code', 'like', "%{$s}%"))
            ->orderBy('code')
            ->get(['id', 'code', 'name_th', 'sale_price', 'image', 'category_id']);

        return response()->json($products);
    }
}
