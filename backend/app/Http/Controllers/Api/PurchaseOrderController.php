<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Services\DocumentNumberService;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = PurchaseOrder::with(['partner', 'items.product'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $s) => $q->where('number', 'like', "%{$s}%"))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($request->per_page ?? 20);

        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        return DB::transaction(function () use ($data) {
            $order = PurchaseOrder::create([
                'number' => DocumentNumberService::next('PO', $data['date']),
                'partner_id' => $data['partner_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'date' => $data['date'],
                'expected_date' => $data['expected_date'] ?? null,
                'status' => 'draft',
                'discount_amount' => $data['discount_amount'] ?? 0,
                'note' => $data['note'] ?? null,
                'created_by' => auth()->id(),
            ]);

            $this->syncItems($order, $data['items']);
            $this->recalculate($order);

            return response()->json($order->load(['partner', 'items.product']), 201);
        });
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return response()->json($purchaseOrder->load(['partner', 'warehouse', 'items.product', 'creator']));
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        abort_unless($purchaseOrder->status === 'draft', 422, 'แก้ไขได้เฉพาะใบสั่งซื้อสถานะร่าง');

        $data = $this->validateData($request);

        return DB::transaction(function () use ($purchaseOrder, $data) {
            $purchaseOrder->update([
                'partner_id' => $data['partner_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'date' => $data['date'],
                'expected_date' => $data['expected_date'] ?? null,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'note' => $data['note'] ?? null,
            ]);

            $purchaseOrder->items()->delete();
            $this->syncItems($purchaseOrder, $data['items']);
            $this->recalculate($purchaseOrder);

            return response()->json($purchaseOrder->load(['partner', 'items.product']));
        });
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        abort_unless($purchaseOrder->status === 'draft', 422, 'ลบได้เฉพาะใบสั่งซื้อสถานะร่าง');

        $purchaseOrder->delete();

        return response()->json(['message' => 'deleted']);
    }

    public function confirm(PurchaseOrder $purchaseOrder)
    {
        abort_unless($purchaseOrder->status === 'draft', 422, 'ใบสั่งซื้อนี้ไม่สามารถยืนยันได้');

        $purchaseOrder->update(['status' => 'confirmed']);

        return response()->json($purchaseOrder->load(['partner', 'items.product']));
    }

    public function cancel(PurchaseOrder $purchaseOrder)
    {
        abort_if($purchaseOrder->status === 'received', 422, 'ไม่สามารถยกเลิกใบสั่งซื้อที่รับสินค้าแล้วได้');

        $purchaseOrder->update(['status' => 'cancelled']);

        return response()->json($purchaseOrder);
    }

    /**
     * รับสินค้าเข้าคลัง (สร้าง stock movement เข้า)
     */
    public function receive(PurchaseOrder $purchaseOrder)
    {
        abort_unless($purchaseOrder->status === 'confirmed', 422, 'ต้องยืนยันใบสั่งซื้อก่อนรับสินค้า');
        abort_if(! $purchaseOrder->warehouse_id, 422, 'ต้องระบุคลังสินค้า');

        return DB::transaction(function () use ($purchaseOrder) {
            foreach ($purchaseOrder->items as $item) {
                StockService::move(
                    $item->product,
                    $item->qty,
                    'receipt',
                    'purchase_order',
                    $purchaseOrder->id,
                    $purchaseOrder->warehouse_id,
                    $item->unit_price,
                    $purchaseOrder->date,
                    "รับสินค้าจากใบสั่งซื้อ {$purchaseOrder->number}",
                    auth()->id(),
                );
            }

            $purchaseOrder->update(['status' => 'received']);

            return response()->json($purchaseOrder->load(['partner', 'items.product']));
        });
    }

    protected function syncItems(PurchaseOrder $order, array $items): void
    {
        foreach ($items as $item) {
            $order->items()->create([
                'product_id' => $item['product_id'],
                'qty' => $item['qty'],
                'unit_price' => $item['unit_price'],
                'vat_rate' => $item['vat_rate'] ?? 7,
                'amount' => round($item['qty'] * $item['unit_price'], 2),
            ]);
        }
    }

    protected function recalculate(PurchaseOrder $order): void
    {
        $subtotal = $order->items->sum('amount');
        $vatRate = $order->items->first()?->vat_rate ?? 0;
        $vat = round(($subtotal - $order->discount_amount) * $vatRate / 100, 2);
        $total = round($subtotal - $order->discount_amount + $vat, 2);

        $order->update([
            'subtotal' => $subtotal,
            'vat_amount' => $vat,
            'total' => $total,
        ]);
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'date' => 'required|date',
            'expected_date' => 'nullable|date',
            'discount_amount' => 'nullable|numeric|min:0',
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.vat_rate' => 'nullable|numeric|min:0|max:100',
        ]);
    }
}
