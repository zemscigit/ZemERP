<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UnitController extends Controller
{
    public function index()
    {
        return response()->json(Unit::orderBy('code')->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        return response()->json(Unit::create($data), 201);
    }

    public function update(Request $request, Unit $unit)
    {
        $data = $this->validateData($request, $unit->id);

        $unit->update($data);

        return response()->json($unit);
    }

    public function destroy(Unit $unit)
    {
        $unit->delete();

        return response()->json(['message' => 'deleted']);
    }

    protected function validateData(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', Rule::unique('units', 'code')->ignore($id)],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
    }
}
