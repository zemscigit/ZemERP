<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\DeliveryItem;
use App\Models\SalesOrder;
use App\Services\AccountingService;
use App\Services\DocumentNumberService;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DeliveryController extends Controller
{
    public function index(Request $request)
    {
        $deliveries = Delivery::with(['partner', 'salesOrder', 'items.product'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $s) => $q->where('number', 'like', "%{$s}%"))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($request->per_page ?? 20);

        return response()->json($deliveries);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        return DB::transaction(function () use ($data) {
            $delivery = Delivery::create([
                'number' => DocumentNumberService::next('DV', $data['date']),
                'sales_order_id' => $data['sales_order_id'] ?? null,
                'partner_id' => $data['partner_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'date' => $data['date'],
                'status' => 'draft',
                'note' => $data['note'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach ($data['items'] as $item) {
                $delivery->items()->create([
                    'product_id' => $item['product_id'],
                    'qty' => $item['qty'],
                    'unit_price' => $item['unit_price'] ?? 0,
                    'amount' => round($item['qty'] * ($item['unit_price'] ?? 0), 2),
                ]);
            }

            return response()->json($delivery->load(['partner', 'items.product']), 201);
        });
    }

    public function show(Delivery $delivery)
    {
        return response()->json($delivery->load(['partner', 'warehouse', 'salesOrder', 'items.product', 'creator']));
    }

    public function update(Request $request, Delivery $delivery)
    {
        abort_unless($delivery->status === 'draft', 422, 'แก้ไขได้เฉพาะใบส่งสินค้าสถานะร่าง');

        $data = $this->validateData($request);

        return DB::transaction(function () use ($delivery, $data) {
            $delivery->update([
                'sales_order_id' => $data['sales_order_id'] ?? null,
                'partner_id' => $data['partner_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'date' => $data['date'],
                'note' => $data['note'] ?? null,
            ]);

            $delivery->items()->delete();
            foreach ($data['items'] as $item) {
                $delivery->items()->create([
                    'product_id' => $item['product_id'],
                    'qty' => $item['qty'],
                    'unit_price' => $item['unit_price'] ?? 0,
                    'amount' => round($item['qty'] * ($item['unit_price'] ?? 0), 2),
                ]);
            }

            return response()->json($delivery->load(['partner', 'items.product']));
        });
    }

    public function destroy(Delivery $delivery)
    {
        abort_unless($delivery->status === 'draft', 422, 'ลบได้เฉพาะใบส่งสินค้าสถานะร่าง');

        $delivery->delete();

        return response()->json(['message' => 'deleted']);
    }

    /**
     * ส่งสินค้า: ตัดสต็อกออก + ลงบัญชี COGS
     */
    public function complete(Delivery $delivery)
    {
        abort_unless($delivery->status === 'draft', 422, 'ใบส่งสินค้านี้ส่งสินค้าแล้ว');
        abort_if(! $delivery->warehouse_id, 422, 'ต้องระบุคลังสินค้า');

        return DB::transaction(function () use ($delivery) {
            $lines = $delivery->items->map(fn ($i) => [
                'product_id' => $i->product_id,
                'qty' => $i->qty,
            ])->all();

            StockService::assertStockEnough($lines, $delivery->warehouse_id);

            foreach ($delivery->items as $item) {
                StockService::move(
                    $item->product,
                    -$item->qty,
                    'delivery',
                    'delivery',
                    $delivery->id,
                    $delivery->warehouse_id,
                    $item->product->purchase_price,
                    $delivery->date,
                    "ส่งสินค้า {$delivery->number}",
                    auth()->id(),
                );
            }

            $delivery->update(['status' => 'delivered']);

            if ($delivery->sales_order_id) {
                $delivery->salesOrder->update(['status' => 'delivered']);
            }

            AccountingService::postDelivery($delivery);

            return response()->json($delivery->load(['partner', 'items.product']));
        });
    }

    public function cancel(Delivery $delivery)
    {
        abort_unless($delivery->status === 'draft', 422, 'ไม่สามารถยกเลิกใบส่งสินค้าที่ส่งแล้วได้');

        $delivery->update(['status' => 'cancelled']);

        return response()->json($delivery);
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'sales_order_id' => ['nullable', Rule::exists('sales_orders', 'id')],
            'partner_id' => 'required|exists:partners,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'date' => 'required|date',
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'nullable|numeric|min:0',
        ]);
    }
}
