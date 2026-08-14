<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Services\DocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesOrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = SalesOrder::with(['partner', 'items.product'])
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
            $order = SalesOrder::create([
                'number' => DocumentNumberService::next('SO', $data['date']),
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

    public function show(SalesOrder $salesOrder)
    {
        return response()->json($salesOrder->load(['partner', 'warehouse', 'items.product', 'deliveries', 'creator']));
    }

    public function update(Request $request, SalesOrder $salesOrder)
    {
        abort_unless($salesOrder->status === 'draft', 422, 'แก้ไขได้เฉพาะใบสั่งขายสถานะร่าง');

        $data = $this->validateData($request);

        return DB::transaction(function () use ($salesOrder, $data) {
            $salesOrder->update([
                'partner_id' => $data['partner_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'date' => $data['date'],
                'expected_date' => $data['expected_date'] ?? null,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'note' => $data['note'] ?? null,
            ]);

            $salesOrder->items()->delete();
            $this->syncItems($salesOrder, $data['items']);
            $this->recalculate($salesOrder);

            return response()->json($salesOrder->load(['partner', 'items.product']));
        });
    }

    public function destroy(SalesOrder $salesOrder)
    {
        abort_unless($salesOrder->status === 'draft', 422, 'ลบได้เฉพาะใบสั่งขายสถานะร่าง');

        $salesOrder->delete();

        return response()->json(['message' => 'deleted']);
    }

    public function confirm(SalesOrder $salesOrder)
    {
        abort_unless($salesOrder->status === 'draft', 422, 'ใบสั่งขายนี้ไม่สามารถยืนยันได้');

        $salesOrder->update(['status' => 'confirmed']);

        return response()->json($salesOrder->load(['partner', 'items.product']));
    }

    public function cancel(SalesOrder $salesOrder)
    {
        abort_if($salesOrder->status === 'delivered', 422, 'ไม่สามารถยกเลิกใบสั่งขายที่ส่งสินค้าแล้วได้');

        $salesOrder->update(['status' => 'cancelled']);

        return response()->json($salesOrder);
    }

    protected function syncItems(SalesOrder $order, array $items): void
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

    protected function recalculate(SalesOrder $order): void
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
