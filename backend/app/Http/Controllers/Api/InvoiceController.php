<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Services\AccountingService;
use App\Services\DocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $invoices = Invoice::with(['partner', 'items.product'])
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $s) => $q->where('number', 'like', "%{$s}%"))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($request->per_page ?? 20);

        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $type = $request->input('type', 'sale');

        return DB::transaction(function () use ($data, $type) {
            $vatRate = $data['vat_rate'] ?? 7;
            $whtRate = $data['wht_rate'] ?? 0;

            $invoice = Invoice::create([
                'type' => $type,
                'number' => DocumentNumberService::next($type === 'sale' ? 'INV' : 'PINV', $data['date']),
                'partner_id' => $data['partner_id'],
                'ref_type' => $data['ref_type'] ?? null,
                'ref_id' => $data['ref_id'] ?? null,
                'date' => $data['date'],
                'due_date' => $data['due_date'] ?? null,
                'status' => 'draft',
                'discount_amount' => $data['discount_amount'] ?? 0,
                'vat_rate' => $vatRate,
                'wht_rate' => $whtRate,
                'note' => $data['note'] ?? null,
                'created_by' => auth()->id(),
            ]);

            $this->syncItems($invoice, $data['items'], $vatRate);
            $this->recalculate($invoice);

            return response()->json($invoice->load(['partner', 'items.product']), 201);
        });
    }

    public function show(Invoice $invoice)
    {
        return response()->json($invoice->load(['partner', 'items.product', 'payments', 'creator']));
    }

    public function update(Request $request, Invoice $invoice)
    {
        abort_unless($invoice->status === 'draft', 422, 'แก้ไขได้เฉพาะใบแจ้งหนี้สถานะร่าง');

        $data = $this->validateData($request);

        return DB::transaction(function () use ($invoice, $data) {
            $vatRate = $data['vat_rate'] ?? $invoice->vat_rate;

            $invoice->update([
                'partner_id' => $data['partner_id'],
                'ref_type' => $data['ref_type'] ?? null,
                'ref_id' => $data['ref_id'] ?? null,
                'date' => $data['date'],
                'due_date' => $data['due_date'] ?? null,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'vat_rate' => $vatRate,
                'wht_rate' => $data['wht_rate'] ?? 0,
                'note' => $data['note'] ?? null,
            ]);

            $invoice->items()->delete();
            $this->syncItems($invoice, $data['items'], $vatRate);
            $this->recalculate($invoice);

            return response()->json($invoice->load(['partner', 'items.product']));
        });
    }

    public function destroy(Invoice $invoice)
    {
        abort_unless($invoice->status === 'draft', 422, 'ลบได้เฉพาะใบแจ้งหนี้สถานะร่าง');

        $invoice->delete();

        return response()->json(['message' => 'deleted']);
    }

    /**
     * ออกใบแจ้งหนี้: ลงบัญชีอัตโนมัติ (ขาย/ซื้อ + VAT)
     */
    public function issue(Invoice $invoice)
    {
        abort_unless($invoice->status === 'draft', 422, 'ใบแจ้งหนี้นี้ออกแล้ว');

        return DB::transaction(function () use ($invoice) {
            $invoice->update(['status' => 'issued']);
            AccountingService::postInvoice($invoice);

            return response()->json($invoice->load(['partner', 'items.product']));
        });
    }

    public function cancel(Invoice $invoice)
    {
        abort_if(in_array($invoice->status, ['paid', 'cancelled']), 422, 'ไม่สามารถยกเลิกใบแจ้งหนี้นี้ได้');
        abort_if($invoice->paid_amount > 0, 422, 'ไม่สามารถยกเลิกใบแจ้งหนี้ที่มีการรับ/ชำระเงินแล้วได้');

        return DB::transaction(function () use ($invoice) {
            AccountingService::removePostings('invoice', $invoice->id);
            $invoice->update(['status' => 'cancelled']);

            return response()->json($invoice);
        });
    }

    protected function syncItems(Invoice $invoice, array $items, float $vatRate): void
    {
        foreach ($items as $item) {
            $invoice->items()->create([
                'product_id' => $item['product_id'] ?? null,
                'description' => $item['description'] ?? null,
                'qty' => $item['qty'] ?? 1,
                'unit_price' => $item['unit_price'] ?? 0,
                'vat_rate' => $item['vat_rate'] ?? $vatRate,
                'amount' => round(($item['qty'] ?? 1) * ($item['unit_price'] ?? 0), 2),
            ]);
        }
    }

    protected function recalculate(Invoice $invoice): void
    {
        $subtotal = $invoice->items->sum('amount');
        $vatRate = $invoice->vat_rate;
        $discount = $invoice->discount_amount ?? 0;
        $vat = round(($subtotal - $discount) * $vatRate / 100, 2);
        $wht = $invoice->wht_rate > 0 ? round(($subtotal - $discount) * $invoice->wht_rate / 100, 2) : 0;
        $total = round($subtotal - $discount + $vat, 2);
        $net = round($total - $wht, 2);

        $invoice->update([
            'subtotal' => $subtotal,
            'vat_amount' => $vat,
            'wht_amount' => $wht,
            'total' => $total,
            'net_payable' => $net,
        ]);
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'type' => 'required|in:sale,purchase',
            'partner_id' => 'required|exists:partners,id',
            'ref_type' => 'nullable|string',
            'ref_id' => 'nullable|integer',
            'date' => 'required|date',
            'due_date' => 'nullable|date',
            'vat_rate' => 'nullable|numeric|min:0|max:100',
            'wht_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'nullable|string',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);
    }
}
