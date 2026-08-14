<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WithholdingTaxRate;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaxRateController extends Controller
{
    public function index()
    {
        return response()->json(WithholdingTaxRate::orderBy('rate')->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        return response()->json(WithholdingTaxRate::create($data), 201);
    }

    public function update(Request $request, WithholdingTaxRate $taxRate)
    {
        $data = $this->validateData($request);

        $taxRate->update($data);

        return response()->json($taxRate);
    }

    public function destroy(WithholdingTaxRate $taxRate)
    {
        $taxRate->delete();

        return response()->json(['message' => 'deleted']);
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'type' => 'required|in:goods,service',
            'is_active' => 'boolean',
        ]);
    }
}
