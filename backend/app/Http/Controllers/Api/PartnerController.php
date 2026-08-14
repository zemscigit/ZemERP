<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PartnerController extends Controller
{
    public function index(Request $request)
    {
        $partners = Partner::query()
            ->when($request->type, fn ($q, $t) => $q->whereIn('type', $t === 'customer' ? ['customer', 'both'] : ['supplier', 'both']))
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('code', 'like', "%{$s}%"))
            ->orderBy('code')
            ->paginate($request->per_page ?? 50);

        return response()->json($partners);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        return response()->json(Partner::create($data), 201);
    }

    public function show(Partner $partner)
    {
        return response()->json($partner);
    }

    public function update(Request $request, Partner $partner)
    {
        $data = $this->validateData($request, $partner->id);

        $partner->update($data);

        return response()->json($partner);
    }

    public function destroy(Partner $partner)
    {
        $partner->delete();

        return response()->json(['message' => 'deleted']);
    }

    protected function validateData(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'type' => 'required|in:customer,supplier,both',
            'code' => ['required', 'string', Rule::unique('partners', 'code')->ignore($id)],
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'contact_person' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);
    }
}
