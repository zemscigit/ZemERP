<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $movements = StockMovement::with(['product', 'warehouse', 'creator'])
            ->when($request->product_id, fn ($q, $p) => $q->where('product_id', $p))
            ->when($request->from, fn ($q, $f) => $q->where('date', '>=', $f))
            ->when($request->to, fn ($q, $t) => $q->where('date', '<=', $t))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($request->per_page ?? 30);

        return response()->json($movements);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'qty' => 'required|numeric|not_in:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'date' => 'required|date',
            'note' => 'nullable|string',
        ]);

        $product = Product::findOrFail($data['product_id']);
        $qty = $data['qty'];

        if ($qty < 0 && $product->stockOnHand($data['warehouse_id'] ?? null) + $qty < 0) {
            return response()->json(['message' => 'สต็อกไม่เพียงพอ'], 422);
        }

        $movement = StockService::move(
            $product,
            $qty,
            'adjust',
            'stock_adjust',
            null,
            $data['warehouse_id'] ?? null,
            $data['unit_cost'] ?? $product->purchase_price,
            $data['date'],
            $data['note'] ?? 'ปรับยอดสต็อก',
            auth()->id(),
        );

        return response()->json($movement->load('product'), 201);
    }
}
