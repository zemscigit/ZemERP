<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JournalEntryController extends Controller
{
    public function index(Request $request)
    {
        $entries = JournalEntry::with(['lines.account', 'creator'])
            ->when($request->from, fn ($q, $f) => $q->where('date', '>=', $f))
            ->when($request->to, fn ($q, $t) => $q->where('date', '<=', $t))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($request->per_page ?? 20);

        return response()->json($entries);
    }

    public function show(JournalEntry $journalEntry)
    {
        return response()->json($journalEntry->load(['lines.account', 'creator']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'description' => 'required|string',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:chart_of_accounts,id',
            'lines.*.description' => 'nullable|string',
            'lines.*.debit' => 'nullable|numeric|min:0',
            'lines.*.credit' => 'nullable|numeric|min:0',
        ]);

        $lines = array_map(fn ($l) => [
            \App\Models\ChartOfAccount::find($l['account_id']),
            $l['debit'] ?? 0,
            $l['credit'] ?? 0,
            $l['description'] ?? null,
        ], $data['lines']);

        $entry = AccountingService::createEntry(
            $data['date'],
            $data['description'],
            'general',
            null,
            null,
            $lines,
            auth()->id(),
        );

        return response()->json($entry->load('lines.account'), 201);
    }

    public function destroy(JournalEntry $journalEntry)
    {
        abort_if($journalEntry->ref_type !== null, 422, 'รายการบัญชีอัตโนมัติไม่สามารถลบได้ ให้ยกเลิกเอกสารต้นทางแทน');

        $journalEntry->delete();

        return response()->json(['message' => 'deleted']);
    }
}
