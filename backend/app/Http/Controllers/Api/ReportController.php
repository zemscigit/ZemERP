<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Payment;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\StockMovement;
use App\Services\StockService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Dashboard สรุปยอด
     */
    public function dashboard()
    {
        $today = now()->toDateString();
        $monthStart = now()->startOfMonth()->toDateString();

        $salesToday = Invoice::where('type', 'sale')->whereNotIn('status', ['cancelled'])->where('date', $today)->sum('total');
        $salesMonth = Invoice::where('type', 'sale')->whereNotIn('status', ['cancelled'])->where('date', '>=', $monthStart)->sum('total');
        $purchaseMonth = Invoice::where('type', 'purchase')->whereNotIn('status', ['cancelled'])->where('date', '>=', $monthStart)->sum('total');

        $receivable = Invoice::where('type', 'sale')->whereNotIn('status', ['cancelled', 'paid'])
            ->get()->sum(fn ($i) => max(0, $i->net_payable - $i->paid_amount));
        $payable = Invoice::where('type', 'purchase')->whereNotIn('status', ['cancelled', 'paid'])
            ->get()->sum(fn ($i) => max(0, $i->net_payable - $i->paid_amount));

        $lowStock = Product::with('stockMovements')->get()
            ->filter(fn ($p) => $p->stockOnHand() <= 5)
            ->map(fn ($p) => ['id' => $p->id, 'code' => $p->code, 'name' => $p->name_th, 'stock' => $p->stockOnHand()])
            ->values();

        $recentInvoices = Invoice::with('partner')
            ->whereNotIn('status', ['cancelled'])
            ->orderByDesc('date')
            ->limit(8)
            ->get();

        // ยอดขายรายเดือน 6 เดือนล่าสุด
        $monthlySales = Invoice::where('type', 'sale')
            ->whereNotIn('status', ['cancelled'])
            ->where('date', '>=', now()->subMonths(5)->startOfMonth()->toDateString())
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as ym, SUM(total) as total")
            ->groupBy('ym')
            ->orderBy('ym')
            ->get()
            ->keyBy('ym');

        $labels = [];
        $values = [];
        for ($i = 5; $i >= 0; $i--) {
            $ym = now()->subMonths($i)->format('Y-m');
            $labels[] = now()->subMonths($i)->format('M Y');
            $values[] = (float) ($monthlySales[$ym]->total ?? 0);
        }

        return response()->json([
            'sales_today' => round($salesToday, 2),
            'sales_month' => round($salesMonth, 2),
            'purchase_month' => round($purchaseMonth, 2),
            'receivable' => round($receivable, 2),
            'payable' => round($payable, 2),
            'low_stock' => $lowStock,
            'recent_invoices' => $recentInvoices,
            'chart' => ['labels' => $labels, 'values' => $values],
        ]);
    }

    /**
     * รายงานยอดขายรายวัน/เดือน
     */
    public function sales(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to = $request->to ?? now()->toDateString();

        $daily = Invoice::where('type', 'sale')
            ->whereNotIn('status', ['cancelled'])
            ->whereBetween('date', [$from, $to])
            ->selectRaw("date, COUNT(*) as count, SUM(total) as total, SUM(vat_amount) as vat")
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $byPartner = Invoice::where('type', 'sale')
            ->whereNotIn('status', ['cancelled'])
            ->whereBetween('date', [$from, $to])
            ->selectRaw("partner_id, COUNT(*) as count, SUM(total) as total")
            ->with('partner:id,name')
            ->groupBy('partner_id')
            ->orderByDesc('total')
            ->get();

        $topProducts = DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->join('products', 'products.id', '=', 'invoice_items.product_id')
            ->where('invoices.type', 'sale')
            ->whereNotIn('invoices.status', ['cancelled'])
            ->whereBetween('invoices.date', [$from, $to])
            ->selectRaw("products.id, products.name_th, products.code, SUM(invoice_items.qty) as qty, SUM(invoice_items.amount) as total")
            ->groupBy('products.id', 'products.name_th', 'products.code')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $summary = [
            'total' => round($daily->sum('total'), 2),
            'count' => $daily->sum('count'),
            'vat' => round($daily->sum('vat'), 2),
        ];

        return response()->json(compact('daily', 'byPartner', 'topProducts', 'summary', 'from', 'to'));
    }

    /**
     * รายงานยอดซื้อ
     */
    public function purchases(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to = $request->to ?? now()->toDateString();

        $daily = Invoice::where('type', 'purchase')
            ->whereNotIn('status', ['cancelled'])
            ->whereBetween('date', [$from, $to])
            ->selectRaw("date, COUNT(*) as count, SUM(total) as total, SUM(vat_amount) as vat")
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $byPartner = Invoice::where('type', 'purchase')
            ->whereNotIn('status', ['cancelled'])
            ->whereBetween('date', [$from, $to])
            ->selectRaw("partner_id, COUNT(*) as count, SUM(total) as total")
            ->with('partner:id,name')
            ->groupBy('partner_id')
            ->orderByDesc('total')
            ->get();

        $summary = [
            'total' => round($daily->sum('total'), 2),
            'count' => $daily->sum('count'),
            'vat' => round($daily->sum('vat'), 2),
        ];

        return response()->json(compact('daily', 'byPartner', 'summary', 'from', 'to'));
    }

    /**
     * รายงานภาษีซื้อ/ภาษีขาย (VAT Report)
     */
    public function vat(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to = $request->to ?? now()->toDateString();

        $sales = Invoice::with('partner:id,name')
            ->where('type', 'sale')
            ->whereIn('status', ['issued', 'partial', 'paid'])
            ->whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->get(['id', 'number', 'date', 'partner_id', 'subtotal', 'vat_amount', 'total']);

        $purchases = Invoice::with('partner:id,name')
            ->where('type', 'purchase')
            ->whereIn('status', ['issued', 'partial', 'paid'])
            ->whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->get(['id', 'number', 'date', 'partner_id', 'subtotal', 'vat_amount', 'total']);

        return response()->json([
            'from' => $from,
            'to' => $to,
            'output' => [
                'items' => $sales,
                'base' => round($sales->sum('subtotal'), 2),
                'vat' => round($sales->sum('vat_amount'), 2),
                'total' => round($sales->sum('total'), 2),
            ],
            'input' => [
                'items' => $purchases,
                'base' => round($purchases->sum('subtotal'), 2),
                'vat' => round($purchases->sum('vat_amount'), 2),
                'total' => round($purchases->sum('total'), 2),
            ],
            'net_vat' => round($sales->sum('vat_amount') - $purchases->sum('vat_amount'), 2),
        ]);
    }

    /**
     * รายงานสต็อกคงเหลือ + มูลค่า
     */
    public function stock(Request $request)
    {
        $warehouseId = $request->warehouse_id;
        $products = Product::with(['stockMovements' => fn ($q) => $q->select('product_id', 'warehouse_id', 'qty', 'unit_cost', 'date')])
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        $rows = $products->map(function ($p) use ($warehouseId) {
            $qty = $p->stockOnHand($warehouseId);
            $cost = StockService::averageCost($p, $warehouseId);

            return [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name_th,
                'category' => $p->category,
                'unit' => $p->unit,
                'qty' => round($qty, 3),
                'avg_cost' => $cost,
                'valuation' => round($qty * $cost, 2),
                'sale_price' => $p->sale_price,
            ];
        });

        return response()->json([
            'items' => $rows,
            'summary' => [
                'total_qty' => round($rows->sum('qty'), 3),
                'total_value' => round($rows->sum('valuation'), 2),
            ],
        ]);
    }

    /**
     * รายงานภาษีหัก ณ ที่จ่าย
     */
    public function wht(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to = $request->to ?? now()->toDateString();

        $payments = Payment::with('partner:id,name')
            ->where('wht_amount', '>', 0)
            ->whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->get();

        return response()->json([
            'from' => $from,
            'to' => $to,
            'items' => $payments,
            'total_wht' => round($payments->sum('wht_amount'), 2),
        ]);
    }

    /**
     * รายงานการเคลื่อนไหวสต็อก (Stock Movement)
     */
    public function stockMovements(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'type' => 'nullable|in:in,out',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $movements = StockMovement::with(['product', 'warehouse'])
            ->when($data['product_id'] ?? null, fn ($q, $v) => $q->where('product_id', $v))
            ->when($data['warehouse_id'] ?? null, fn ($q, $v) => $q->where('warehouse_id', $v))
            ->when(($data['type'] ?? null) === 'in', fn ($q) => $q->where('qty', '>', 0))
            ->when(($data['type'] ?? null) === 'out', fn ($q) => $q->where('qty', '<', 0))
            ->when($data['from'] ?? null, fn ($q, $v) => $q->where('date', '>=', $v))
            ->when($data['to'] ?? null, fn ($q, $v) => $q->where('date', '<=', $v))
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        $refLabels = $this->resolveRefLabels($movements);

        $items = $movements->map(function ($m) use ($refLabels) {
            return [
                'id' => $m->id,
                'date' => $m->date->toDateString(),
                'ref_type' => $m->ref_type,
                'ref_label' => $refLabels[$m->id] ?? '-',
                'product_code' => $m->product?->code,
                'product_name' => $m->product?->name_th,
                'warehouse_name' => $m->warehouse?->name,
                'qty' => round($m->qty, 3),
                'in' => $m->qty > 0 ? round($m->qty, 3) : 0,
                'out' => $m->qty < 0 ? round(abs($m->qty), 3) : 0,
                'unit_cost' => round($m->unit_cost, 2),
                'value' => round(abs($m->qty) * $m->unit_cost, 2),
                'note' => $m->note,
            ];
        });

        return response()->json([
            'from' => $data['from'] ?? null,
            'to' => $data['to'] ?? null,
            'items' => $items,
            'summary' => [
                'count' => $movements->count(),
                'total_in' => round($movements->where('qty', '>', 0)->sum('qty'), 3),
                'total_out' => round(abs($movements->where('qty', '<', 0)->sum('qty')), 3),
                'total_value' => round($items->sum('value'), 2),
            ],
        ]);
    }

    /**
     * บัตรสต็อก (Stock Card) — ยอดยกมา + รายการเคลื่อนไหว + ยอดคงเหลือรายการต่อรายการ
     */
    public function stockCard(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $product = Product::findOrFail($data['product_id']);

        $movements = StockMovement::where('product_id', $product->id)
            ->when($data['warehouse_id'] ?? null, fn ($q, $v) => $q->where('warehouse_id', $v))
            ->when($data['from'] ?? null, fn ($q, $v) => $q->where('date', '>=', $v))
            ->when($data['to'] ?? null, fn ($q, $v) => $q->where('date', '<=', $v))
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        // ยอดยกมา = ผลรวม qty ทั้งหมดก่อนวันที่เริ่มต้น
        $opening = StockMovement::where('product_id', $product->id)
            ->when($data['warehouse_id'] ?? null, fn ($q, $v) => $q->where('warehouse_id', $v))
            ->when($data['from'] ?? null, fn ($q, $v) => $q->where('date', '<', $v))
            ->sum('qty');

        $refLabels = $this->resolveRefLabels($movements);

        $balance = round($opening, 3);
        $items = $movements->map(function ($m) use (&$balance, $refLabels) {
            $balance = round($balance + $m->qty, 3);

            return [
                'id' => $m->id,
                'date' => $m->date->toDateString(),
                'ref_label' => $refLabels[$m->id] ?? '-',
                'in' => $m->qty > 0 ? round($m->qty, 3) : 0,
                'out' => $m->qty < 0 ? round(abs($m->qty), 3) : 0,
                'balance' => $balance,
                'unit_cost' => round($m->unit_cost, 2),
                'note' => $m->note,
            ];
        });

        return response()->json([
            'product' => [
                'id' => $product->id,
                'code' => $product->code,
                'name' => $product->name_th,
                'unit' => $product->unit,
            ],
            'warehouse_id' => $data['warehouse_id'] ?? null,
            'from' => $data['from'] ?? null,
            'to' => $data['to'] ?? null,
            'opening' => round($opening, 3),
            'closing' => $items->last()['balance'] ?? round($opening, 3),
            'total_in' => round($movements->where('qty', '>', 0)->sum('qty'), 3),
            'total_out' => round(abs($movements->where('qty', '<', 0)->sum('qty')), 3),
            'items' => $items,
        ]);
    }

    /**
     * แปลง ref_type/ref_id เป็นเลขที่เอกสารอ้างอิง (batch)
     */
    protected function resolveRefLabels($movements): array
    {
        $labels = [];

        foreach ($movements->groupBy('ref_type') as $refType => $rows) {
            $ids = $rows->pluck('ref_id')->filter()->unique()->values();
            $numbers = collect();

            if ($refType === 'purchase_order' && $ids->isNotEmpty()) {
                $numbers = PurchaseOrder::whereIn('id', $ids)->pluck('number', 'id');
            } elseif ($refType === 'delivery' && $ids->isNotEmpty()) {
                $numbers = Delivery::whereIn('id', $ids)->pluck('number', 'id');
            } elseif ($refType === 'invoice' && $ids->isNotEmpty()) {
                $numbers = Invoice::whereIn('id', $ids)->pluck('number', 'id');
            } elseif ($refType === 'sales_order' && $ids->isNotEmpty()) {
                $numbers = SalesOrder::whereIn('id', $ids)->pluck('number', 'id');
            }

            foreach ($rows as $m) {
                if ($refType === 'stock_adjust' || ! $m->ref_id) {
                    $labels[$m->id] = 'ปรับยอดสต็อก';
                } else {
                    $labels[$m->id] = $numbers[$m->ref_id] ?? '#'.$m->ref_id;
                }
            }
        }

        return $labels;
    }

    /**
     * G/L Entry — รายการบัญชีรายบรรทัด (Debit/Credit) ตามเลขที่เอกสาร และรหัสบัญชี
     */
    public function glEntries(Request $request)
    {
        $data = $request->validate([
            'account_id' => 'nullable|exists:chart_of_accounts,id',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'search' => 'nullable|string|max:100',
            'doc_ref' => 'nullable|string|max:100',
        ]);

        $entries = JournalEntry::with(['lines.account', 'creator'])
            ->when($data['from'] ?? null, fn ($q, $f) => $q->where('date', '>=', $f))
            ->when($data['to'] ?? null, fn ($q, $t) => $q->where('date', '<=', $t))
            ->when($data['search'] ?? null, fn ($q, $s) => $q->where(fn ($qq) => $qq->where('entry_number', 'like', "%{$s}%")->orWhere('description', 'like', "%{$s}%")))
            ->when($data['account_id'] ?? null, fn ($q, $a) => $q->whereHas('lines', fn ($l) => $l->where('account_id', $a)))
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        $refLabels = $this->resolveJournalRefLabels($entries);

        // Filter by doc_ref if provided
        if (! empty($data['doc_ref'])) {
            $docRef = $data['doc_ref'];
            $entries = $entries->filter(fn ($entry) => str_contains($refLabels[$entry->id] ?? '', $docRef));
        }

        $items = [];
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($entries as $entry) {
            foreach ($entry->lines as $line) {
                $items[] = [
                    'entry_id' => $entry->id,
                    'entry_number' => $entry->entry_number,
                    'date' => $entry->date->toDateString(),
                    'type' => $entry->type,
                    'description' => $entry->description,
                    'ref_label' => $refLabels[$entry->id] ?? null,
                    'line_description' => $line->description,
                    'account_code' => $line->account?->code,
                    'account_name' => $line->account?->name_th,
                    'debit' => round($line->debit, 2),
                    'credit' => round($line->credit, 2),
                ];
                $totalDebit += $line->debit;
                $totalCredit += $line->credit;
            }
        }

        return response()->json([
            'from' => $data['from'] ?? null,
            'to' => $data['to'] ?? null,
            'items' => $items,
            'summary' => [
                'count' => count($items),
                'total_debit' => round($totalDebit, 2),
                'total_credit' => round($totalCredit, 2),
            ],
        ]);
    }

    /**
     * แปลง ref_type/ref_id ของรายการบัญชีเป็นเลขที่เอกสารต้นทาง (batch)
     */
    protected function resolveJournalRefLabels($entries): array
    {
        $labels = [];

        foreach ($entries->groupBy('ref_type') as $refType => $rows) {
            $ids = $rows->pluck('ref_id')->filter()->unique()->values();
            $numbers = collect();

            if ($refType === 'invoice' && $ids->isNotEmpty()) {
                $numbers = Invoice::whereIn('id', $ids)->pluck('number', 'id');
            } elseif ($refType === 'delivery' && $ids->isNotEmpty()) {
                $numbers = Delivery::whereIn('id', $ids)->pluck('number', 'id');
            } elseif ($refType === 'payment' && $ids->isNotEmpty()) {
                $numbers = Payment::whereIn('id', $ids)->pluck('number', 'id');
            }

            foreach ($rows as $entry) {
                $labels[$entry->id] = $numbers[$entry->ref_id] ?? null;
            }
        }

        return $labels;
    }

    /**
     * งบทดลอง (Trial Balance)
     */
    public function trialBalance(Request $request)
    {
        $to = $request->to ?? now()->toDateString();

        $rows = JournalEntryLine::join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->where('journal_entries.date', '<=', $to)
            ->selectRaw("account_id, SUM(debit) as total_debit, SUM(credit) as total_credit")
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');

        $accounts = ChartOfAccount::orderBy('code')->get()->map(function ($account) use ($rows) {
            $row = $rows[$account->id] ?? null;
            $debit = (float) ($row->total_debit ?? 0);
            $credit = (float) ($row->total_credit ?? 0);

            // บัญชีฝั่งเดบิต (asset/expense) = debit - credit, ฝั่งเครดิต (liability/equity/income) = credit - debit
            $normalDebit = in_array($account->type, ['asset', 'expense']);
            $balance = $normalDebit ? $debit - $credit : $credit - $debit;

            return [
                'id' => $account->id,
                'code' => $account->code,
                'name_th' => $account->name_th,
                'name_en' => $account->name_en,
                'type' => $account->type,
                'debit' => round($debit, 2),
                'credit' => round($credit, 2),
                'balance' => round($balance, 2),
            ];
        });

        return response()->json([
            'to' => $to,
            'items' => $accounts,
            'total_debit' => round($accounts->sum('debit'), 2),
            'total_credit' => round($accounts->sum('credit'), 2),
        ]);
    }

    /**
     * ทะเบียนบัญชี (Account Ledger)
     */
    public function ledger(Request $request)
    {
        $data = $request->validate([
            'account_id' => 'required|exists:chart_of_accounts,id',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $lines = JournalEntryLine::with(['journalEntry', 'journalEntry.creator'])
            ->where('account_id', $data['account_id'])
            ->when($data['from'] ?? null, fn ($q, $f) => $q->whereHas('journalEntry', fn ($je) => $je->where('date', '>=', $f)))
            ->when($data['to'] ?? null, fn ($q, $t) => $q->whereHas('journalEntry', fn ($je) => $je->where('date', '<=', $t)))
            ->orderByDesc('journalEntry.date')
            ->orderByDesc('id')
            ->paginate(50);

        return response()->json($lines);
    }
}
