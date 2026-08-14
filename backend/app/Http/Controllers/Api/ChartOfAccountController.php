<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ChartOfAccountController extends Controller
{
    public function index(Request $request)
    {
        $accounts = ChartOfAccount::query()
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->search, fn ($q, $s) => $q->where('name_th', 'like', "%{$s}%")
                ->orWhere('name_en', 'like', "%{$s}%")
                ->orWhere('code', 'like', "%{$s}%"))
            ->orderBy('code')
            ->get();

        return response()->json($accounts);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        return response()->json(ChartOfAccount::create($data), 201);
    }

    public function update(Request $request, ChartOfAccount $chartOfAccount)
    {
        $data = $this->validateData($request, $chartOfAccount->id);

        $chartOfAccount->update($data);

        return response()->json($chartOfAccount);
    }

    public function destroy(ChartOfAccount $chartOfAccount)
    {
        if ($chartOfAccount->journalLines()->exists()) {
            return response()->json(['message' => 'ไม่สามารถลบบัญชีที่มีรายการเคลื่อนไหวแล้วได้'], 422);
        }

        $chartOfAccount->delete();

        return response()->json(['message' => 'deleted']);
    }

    protected function validateData(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', Rule::unique('chart_of_accounts', 'code')->ignore($id)],
            'name_th' => 'required|string',
            'name_en' => 'required|string',
            'type' => 'required|in:asset,liability,equity,income,expense',
            'parent_code' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
    }
}
