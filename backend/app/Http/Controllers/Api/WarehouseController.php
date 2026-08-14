<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WarehouseController extends Controller
{
    public function index()
    {
        return response()->json(Warehouse::orderBy('code')->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        return response()->json(Warehouse::create($data), 201);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $data = $this->validateData($request, $warehouse->id);

        $warehouse->update($data);

        return response()->json($warehouse);
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();

        return response()->json(['message' => 'deleted']);
    }

    protected function validateData(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', Rule::unique('warehouses', 'code')->ignore($id)],
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
    }
}
