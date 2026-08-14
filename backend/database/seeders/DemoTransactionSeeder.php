<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\Partner;
use App\Models\Payment;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Receipt;
use App\Models\SalesOrder;
use App\Models\Warehouse;
use App\Services\AccountingService;
use App\Services\DocumentNumberService;
use App\Services\StockService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoTransactionSeeder extends Seeder
{
    public function run(): void
    {
        // รันได้ครั้งเดียว เพื่อกันข้อมูลซ้ำเมื่อ seed ซ้ำ
        if (PurchaseOrder::exists() || SalesOrder::exists()) {
            return;
        }

        $supplier = Partner::where('code', 'S-0001')->first();
        $customer = Partner::where('code', 'C-0001')->first();
        $warehouse = Warehouse::where('code', 'WH-01')->first();
        $user = \App\Models\User::where('email', 'admin@zemerp.com')->first();
        $userId = $user?->id;

        $desktop = Product::where('code', 'P-0001')->first();
        $monitor = Product::where('code', 'P-0002')->first();

        if (! $supplier || ! $customer || ! $desktop || ! $monitor) {
            return;
        }

        DB::transaction(function () use ($supplier, $customer, $warehouse, $userId, $desktop, $monitor) {
            $today = now()->toDateString();

            // ===== วงจรซื้อ =====
            $po = PurchaseOrder::create([
                'number' => DocumentNumberService::next('PO', now()),
                'partner_id' => $supplier->id,
                'warehouse_id' => $warehouse->id,
                'date' => $today,
                'status' => 'confirmed',
                'discount_amount' => 0,
                'note' => 'ใบสั่งซื้อตัวอย่าง',
                'created_by' => $userId,
            ]);
            $po->items()->create(['product_id' => $desktop->id, 'qty' => 2, 'unit_price' => 18000, 'vat_rate' => 7, 'amount' => 36000]);
            $po->items()->create(['product_id' => $monitor->id, 'qty' => 5, 'unit_price' => 3200, 'vat_rate' => 7, 'amount' => 16000]);
            $po->update(['subtotal' => 52000, 'vat_amount' => 3640, 'total' => 55640]);

            // รับสินค้าเข้าคลัง
            foreach ($po->items as $item) {
                StockService::move($item->product, $item->qty, 'receipt', 'purchase_order', $po->id, $warehouse->id, $item->unit_price, $today, "รับสินค้า {$po->number}", $userId);
            }

            // ใบกำกับภาษีซื้อ + ลงบัญชี
            $purchaseInvoice = Invoice::create([
                'type' => 'purchase',
                'number' => DocumentNumberService::next('PINV', now()),
                'partner_id' => $supplier->id,
                'ref_type' => 'purchase_order',
                'ref_id' => $po->id,
                'date' => $today,
                'due_date' => now()->addDays(30)->toDateString(),
                'status' => 'issued',
                'vat_rate' => 7,
                'wht_rate' => 1,
                'subtotal' => 52000,
                'vat_amount' => 3640,
                'wht_amount' => 520,
                'total' => 55640,
                'net_payable' => 55120,
                'note' => 'ใบกำกับภาษีซื้อตัวอย่าง',
                'created_by' => $userId,
            ]);
            $purchaseInvoice->items()->create(['product_id' => $desktop->id, 'description' => null, 'qty' => 2, 'unit_price' => 18000, 'vat_rate' => 7, 'amount' => 36000]);
            $purchaseInvoice->items()->create(['product_id' => $monitor->id, 'description' => null, 'qty' => 5, 'unit_price' => 3200, 'vat_rate' => 7, 'amount' => 16000]);
            AccountingService::postInvoice($purchaseInvoice);

            // ชำระเงิน (หัก ณ ที่จ่าย 1%)
            $paymentOut = Payment::create([
                'type' => 'out',
                'number' => DocumentNumberService::next('PMT', now()),
                'partner_id' => $supplier->id,
                'invoice_id' => $purchaseInvoice->id,
                'date' => $today,
                'amount' => 55120,
                'wht_amount' => 520,
                'method' => 'bank',
                'note' => 'ชำระหนี้ค่าสินค้า',
                'created_by' => $userId,
            ]);
            AccountingService::postPayment($paymentOut);
            $purchaseInvoice->update(['paid_amount' => 55120, 'status' => 'paid']);

            // ===== วงจรขาย =====
            $so = SalesOrder::create([
                'number' => DocumentNumberService::next('SO', now()),
                'partner_id' => $customer->id,
                'warehouse_id' => $warehouse->id,
                'date' => $today,
                'status' => 'confirmed',
                'discount_amount' => 0,
                'note' => 'ใบสั่งขายตัวอย่าง',
                'created_by' => $userId,
            ]);
            $so->items()->create(['product_id' => $desktop->id, 'qty' => 2, 'unit_price' => 22000, 'vat_rate' => 7, 'amount' => 44000]);
            $so->items()->create(['product_id' => $monitor->id, 'qty' => 5, 'unit_price' => 4200, 'vat_rate' => 7, 'amount' => 21000]);
            $so->update(['subtotal' => 65000, 'vat_amount' => 4550, 'total' => 69550]);

            // ใบส่งสินค้า + ตัดสต็อก + COGS
            $delivery = $so->deliveries()->create([
                'number' => DocumentNumberService::next('DV', now()),
                'partner_id' => $customer->id,
                'warehouse_id' => $warehouse->id,
                'date' => $today,
                'status' => 'delivered',
                'note' => 'ส่งสินค้าตัวอย่าง',
                'created_by' => $userId,
            ]);
            $delivery->items()->create(['product_id' => $desktop->id, 'qty' => 2, 'unit_price' => 22000, 'amount' => 44000]);
            $delivery->items()->create(['product_id' => $monitor->id, 'qty' => 5, 'unit_price' => 4200, 'amount' => 21000]);
            foreach ($delivery->items as $item) {
                StockService::move($item->product, -$item->qty, 'delivery', 'delivery', $delivery->id, $warehouse->id, $item->product->purchase_price, $today, "ส่งสินค้า {$delivery->number}", $userId);
            }
            $so->update(['status' => 'delivered']);
            AccountingService::postDelivery($delivery);

            // ใบแจ้งหนี้ขาย + ลงบัญชี
            $salesInvoice = Invoice::create([
                'type' => 'sale',
                'number' => DocumentNumberService::next('INV', now()),
                'partner_id' => $customer->id,
                'ref_type' => 'sales_order',
                'ref_id' => $so->id,
                'date' => $today,
                'due_date' => now()->addDays(30)->toDateString(),
                'status' => 'issued',
                'vat_rate' => 7,
                'wht_rate' => 0,
                'subtotal' => 65000,
                'vat_amount' => 4550,
                'wht_amount' => 0,
                'total' => 69550,
                'net_payable' => 69550,
                'note' => 'ใบแจ้งหนี้ตัวอย่าง',
                'created_by' => $userId,
            ]);
            $salesInvoice->items()->create(['product_id' => $desktop->id, 'description' => null, 'qty' => 2, 'unit_price' => 22000, 'vat_rate' => 7, 'amount' => 44000]);
            $salesInvoice->items()->create(['product_id' => $monitor->id, 'description' => null, 'qty' => 5, 'unit_price' => 4200, 'vat_rate' => 7, 'amount' => 21000]);
            AccountingService::postInvoice($salesInvoice);

            // รับเงิน + ใบเสร็จรับเงิน
            $paymentIn = Payment::create([
                'type' => 'in',
                'number' => DocumentNumberService::next('RC', now()),
                'partner_id' => $customer->id,
                'invoice_id' => $salesInvoice->id,
                'date' => $today,
                'amount' => 69550,
                'wht_amount' => 0,
                'method' => 'bank',
                'note' => 'รับชำระค่าสินค้า',
                'created_by' => $userId,
            ]);
            Receipt::create([
                'number' => $paymentIn->number,
                'payment_id' => $paymentIn->id,
                'partner_id' => $customer->id,
                'date' => $today,
                'amount' => 69550,
                'note' => 'รับชำระค่าสินค้า',
                'created_by' => $userId,
            ]);
            AccountingService::postPayment($paymentIn);
            $salesInvoice->update(['paid_amount' => 69550, 'status' => 'paid']);
        });
    }
}
