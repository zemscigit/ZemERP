<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Receipt;
use App\Services\AccountingService;
use App\Services\DocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $payments = Payment::with(['partner', 'invoice', 'receipt'])
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->search, fn ($q, $s) => $q->where('number', 'like', "%{$s}%"))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($request->per_page ?? 20);

        return response()->json($payments);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $type = $data['type'];

        return DB::transaction(function () use ($data, $type) {
            $prefix = $type === 'in' ? 'RC' : 'PMT';

            $payment = Payment::create([
                'type' => $type,
                'number' => DocumentNumberService::next($prefix, $data['date']),
                'partner_id' => $data['partner_id'],
                'invoice_id' => $data['invoice_id'] ?? null,
                'date' => $data['date'],
                'amount' => $data['amount'],
                'wht_amount' => $data['wht_amount'] ?? 0,
                'method' => $data['method'] ?? 'cash',
                'reference' => $data['reference'] ?? null,
                'note' => $data['note'] ?? null,
                'created_by' => auth()->id(),
            ]);

            // สร้างใบเสร็จรับเงินอัตโนมัติสำหรับการรับเงิน
            if ($type === 'in') {
                Receipt::create([
                    'number' => $payment->number,
                    'payment_id' => $payment->id,
                    'partner_id' => $data['partner_id'],
                    'date' => $data['date'],
                    'amount' => $data['amount'],
                    'note' => $data['note'] ?? null,
                    'created_by' => auth()->id(),
                ]);
            }

            $this->updateInvoicePaid($payment, $data);
            AccountingService::postPayment($payment);

            return response()->json($payment->load(['partner', 'invoice', 'receipt']), 201);
        });
    }

    public function show(Payment $payment)
    {
        return response()->json($payment->load(['partner', 'invoice', 'receipt', 'creator']));
    }

    public function destroy(Payment $payment)
    {
        return DB::transaction(function () use ($payment) {
            // คืนยอดชำระให้ใบแจ้งหนี้
            if ($payment->invoice_id) {
                $invoice = $payment->invoice;
                $invoice->paid_amount = max(0, $invoice->paid_amount - $payment->amount);
                $invoice->status = $invoice->paid_amount >= $invoice->net_payable ? 'paid' : ($invoice->paid_amount > 0 ? 'partial' : 'issued');
                $invoice->save();
            }

            AccountingService::removePostings('payment', $payment->id);
            $payment->delete();

            return response()->json(['message' => 'deleted']);
        });
    }

    protected function updateInvoicePaid(Payment $payment, array $data): void
    {
        if (! $payment->invoice_id) {
            return;
        }

        $invoice = $payment->invoice;
        $invoice->paid_amount = round($invoice->paid_amount + $payment->amount, 2);
        $invoice->status = $invoice->paid_amount >= $invoice->net_payable ? 'paid' : 'partial';
        $invoice->save();
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'type' => 'required|in:in,out',
            'partner_id' => 'required|exists:partners,id',
            'invoice_id' => 'nullable|exists:invoices,id',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'wht_amount' => 'nullable|numeric|min:0',
            'method' => 'nullable|in:cash,bank,transfer',
            'reference' => 'nullable|string|max:255',
            'note' => 'nullable|string',
        ]);
    }
}
