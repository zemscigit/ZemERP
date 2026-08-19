<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::with(['stockMovements' => fn ($q) => $q->select('product_id', 'qty'), 'categoryRef', 'unitRef'])
            ->when($request->search, fn ($q, $s) => $q->where('name_th', 'like', "%{$s}%")
                ->orWhere('code', 'like', "%{$s}%"))
            ->orderBy('code')
            ->paginate($request->per_page ?? 50);

        return response()->json([
            'data' => $products->map(fn ($p) => $p->append('stock_on_hand')->makeHidden(['stock_movements'])),
            'meta' => [
                'total' => $products->total(),
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $product = Product::create($data);

        $product->load('categoryRef', 'unitRef');

        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        $product->load('stockMovements.product');

        $product->load('categoryRef', 'unitRef');

        return response()->json([
            'product' => $product,
            'stock_on_hand' => $product->stockOnHand(),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $data = $this->validateData($request, $product->id);

        $product->update($data);

        $product->load('categoryRef', 'unitRef');

        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        if (StockMovement::where('product_id', $product->id)->exists()) {
            return response()->json(['message' => 'ไม่สามารถลบสินค้าที่มีการเคลื่อนไหวสต็อกแล้วได้'], 422);
        }

        $product->delete();

        return response()->json(['message' => 'deleted']);
    }

    protected function validateData(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', Rule::unique('products', 'code')->ignore($id)],
            'barcode' => 'nullable|string',
            'name_th' => 'required|string',
            'name_en' => 'nullable|string',
            'category' => 'nullable|string',
            'unit' => 'nullable|string|max:50',
            'category_id' => 'nullable|exists:categories,id',
            'unit_id' => 'nullable|exists:units,id',
            'image' => 'nullable|string|max:2000000',
            'purchase_price' => 'nullable|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);
    }
}
