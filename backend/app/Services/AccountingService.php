<?php

namespace App\Services;

use App\Models\ChartOfAccount;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AccountingService
{
    /**
     * ดึงรหัสบัญชีที่แมปไว้ใน settings
     */
    public static function mappedAccount(string $key): ChartOfAccount
    {
        $mapping = Setting::get('gl_accounts', []);
        $code = $mapping[$key] ?? null;

        if (! $code) {
            throw new RuntimeException("ยังไม่ได้กำหนดบัญชี {$key} ใน Settings > การตั้งค่าบัญชี");
        }

        $account = ChartOfAccount::where('code', $code)->first();
        if (! $account) {
            throw new RuntimeException("ไม่พบบัญชี {$code} ในผังบัญชี");
        }

        return $account;
    }

    /**
     * ลบรายการบัญชีที่ผูกกับเอกสารอ้างอิง (ใช้ตอนยกเลิก/แก้ไข)
     */
    public static function removePostings(string $refType, int $refId): void
    {
        JournalEntry::where('ref_type', $refType)->where('ref_id', $refId)->delete();
    }

    /**
     * ลงบัญชีใบแจ้งหนี้ (ขาย/ซื้อ) พร้อมภาษีซื้อ/ภาษีขาย
     */
    public static function postInvoice(Invoice $invoice): JournalEntry
    {
        self::removePostings('invoice', $invoice->id);

        $net = $invoice->subtotal - $invoice->discount_amount;

        if ($invoice->type === 'sale') {
            $lines = [
                [self::mappedAccount('accounts_receivable'), $invoice->total, 0, 'ลูกหนี้การค้า'],
                [self::mappedAccount('sales_revenue'), 0, $net, 'รายได้ขายสินค้า'],
                [self::mappedAccount('vat_output'), 0, $invoice->vat_amount, 'ภาษีขาย (VAT Output)'],
            ];
            $description = "ใบแจ้งหนี้ {$invoice->number} / ใบกำกับภาษี";
            $type = 'sales';
        } else {
            $lines = [
                [self::mappedAccount('inventory'), $net, 0, 'สินค้าคงคลัง (ซื้อสินค้า)'],
                [self::mappedAccount('vat_input'), $invoice->vat_amount, 0, 'ภาษีซื้อ (VAT Input)'],
                [self::mappedAccount('accounts_payable'), 0, $invoice->total, 'เจ้าหนี้การค้า'],
            ];
            $description = "ใบแจ้งหนี้ซื้อ {$invoice->number}";
            $type = 'purchase';
        }

        return self::createEntry(
            $invoice->date,
            $description,
            $type,
            'invoice',
            $invoice->id,
            $lines,
            $invoice->created_by
        );
    }

    /**
     * ลงบัญชีตัดสต็อก (ใบส่งสินค้า): COGS / สินค้าคงคลัง
     */
    public static function postDelivery(Delivery $delivery): JournalEntry
    {
        self::removePostings('delivery', $delivery->id);

        $cogsAccount = self::mappedAccount('cogs');
        $inventoryAccount = self::mappedAccount('inventory');

        $totalCost = 0;
        $lines = [];
        foreach ($delivery->items as $item) {
            $cost = StockService::averageCost($item->product, $delivery->warehouse_id) ?: $item->product->purchase_price;
            $lineCost = $cost * $item->qty;
            $totalCost += $lineCost;
            $lines[] = [$cogsAccount, $lineCost, 0, "ต้นทุนขาย - {$item->product->name_th}"];
        }

        $lines[] = [$inventoryAccount, 0, $totalCost, 'สินค้าคงคลัง (ตัดสต็อก)'];

        return self::createEntry(
            $delivery->date,
            "ใบส่งสินค้า {$delivery->number}",
            'delivery',
            'delivery',
            $delivery->id,
            $lines,
            $delivery->created_by
        );
    }

    /**
     * ลงบัญชีรับเงิน/ชำระเงิน (รวมภาษีหัก ณ ที่จ่าย)
     */
    public static function postPayment(Payment $payment): JournalEntry
    {
        self::removePostings('payment', $payment->id);

        $cashAccount = self::mappedAccount('cash');

        if ($payment->type === 'in') {
            $lines = [
                [$cashAccount, $payment->amount, 0, 'รับชำระหนี้'],
                [self::mappedAccount('wht_receivable'), $payment->wht_amount, 0, 'ภาษีหัก ณ ที่จ่าย (รับ)'],
                [self::mappedAccount('accounts_receivable'), 0, $payment->amount + $payment->wht_amount, 'ลูกหนี้การค้า'],
            ];
            $description = "รับเงิน {$payment->number}";
            $type = 'payment_in';
        } else {
            $lines = [
                [self::mappedAccount('accounts_payable'), $payment->amount + $payment->wht_amount, 0, 'เจ้าหนี้การค้า'],
                [self::mappedAccount('wht_payable'), 0, $payment->wht_amount, 'ภาษีหัก ณ ที่จ่าย (จ่าย)'],
                [$cashAccount, 0, $payment->amount, 'ชำระหนี้'],
            ];
            $description = "ชำระเงิน {$payment->number}";
            $type = 'payment_out';
        }

        return self::createEntry(
            $payment->date,
            $description,
            $type,
            'payment',
            $payment->id,
            $lines,
            $payment->created_by
        );
    }

    /**
     * สร้างรายการบัญชี พร้อมตรวจสอบยอดเดบิต = เครดิต
     */
    public static function createEntry(
        string|object $date,
        string $description,
        string $type,
        ?string $refType = null,
        ?int $refId = null,
        array $lines = [],
        ?int $userId = null,
    ): JournalEntry {
        $totalDebit = array_sum(array_map(fn ($l) => $l[1] ?? 0, $lines));
        $totalCredit = array_sum(array_map(fn ($l) => $l[2] ?? 0, $lines));

        if (abs($totalDebit - $totalCredit) > 0.01) {
            throw new RuntimeException("ยอดเดบิตและเครดิตไม่เท่ากัน (Dr {$totalDebit} / Cr {$totalCredit})");
        }

        return DB::transaction(function () use ($date, $description, $type, $refType, $refId, $lines, $userId) {
            $entry = JournalEntry::create([
                'entry_number' => DocumentNumberService::next('GL', $date instanceof \Carbon\Carbon ? $date : \Carbon\Carbon::parse($date)),
                'date' => $date instanceof \Carbon\Carbon ? $date->toDateString() : $date,
                'description' => $description,
                'type' => $type,
                'ref_type' => $refType,
                'ref_id' => $refId,
                'created_by' => $userId,
            ]);

            foreach ($lines as [$account, $debit, $credit, $lineDesc]) {
                $entry->lines()->create([
                    'account_id' => $account->id,
                    'description' => $lineDesc,
                    'debit' => $debit,
                    'credit' => $credit,
                ]);
            }

            return $entry;
        });
    }
}
