<?php

namespace Database\Seeders;

use App\Models\Partner;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WithholdingTaxRate;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // ผู้ใช้
        User::updateOrCreate(['email' => 'admin@zemerp.com'], [
            'name' => 'ผู้ดูแลระบบ',
            'password' => 'password',
            'role' => 'admin',
            'locale' => 'th',
        ]);
        User::updateOrCreate(['email' => 'staff@zemerp.com'], [
            'name' => 'พนักงานขาย',
            'password' => 'password',
            'role' => 'staff',
            'locale' => 'th',
        ]);

        // คลังสินค้า
        Warehouse::updateOrCreate(['code' => 'WH-01'], ['name' => 'คลังหลัก', 'address' => 'กรุงเทพมหานคร']);
        Warehouse::updateOrCreate(['code' => 'WH-02'], ['name' => 'คลังสาขา', 'address' => 'เชียงใหม่']);

        // สินค้า
        $products = [
            ['code' => 'P-0001', 'name_th' => 'คอมพิวเตอร์ตั้งโต๊ะ', 'name_en' => 'Desktop Computer', 'category' => 'คอมพิวเตอร์', 'unit' => 'เครื่อง', 'purchase_price' => 18000, 'sale_price' => 22000],
            ['code' => 'P-0002', 'name_th' => 'จอภาพ LED 24 นิ้ว', 'name_en' => '24" LED Monitor', 'category' => 'คอมพิวเตอร์', 'unit' => 'จอ', 'purchase_price' => 3200, 'sale_price' => 4200],
            ['code' => 'P-0003', 'name_th' => 'คีย์บอร์ดไร้สาย', 'name_en' => 'Wireless Keyboard', 'category' => 'อุปกรณ์', 'unit' => 'ชิ้น', 'purchase_price' => 450, 'sale_price' => 690],
            ['code' => 'P-0004', 'name_th' => 'เมาส์ไร้สาย', 'name_en' => 'Wireless Mouse', 'category' => 'อุปกรณ์', 'unit' => 'ชิ้น', 'purchase_price' => 250, 'sale_price' => 390],
            ['code' => 'P-0005', 'name_th' => 'เครื่องพิมพ์เลเซอร์', 'name_en' => 'Laser Printer', 'category' => 'อุปกรณ์', 'unit' => 'เครื่อง', 'purchase_price' => 6500, 'sale_price' => 7900],
            ['code' => 'P-0006', 'name_th' => 'โน้ตบุ๊ก 15 นิ้ว', 'name_en' => '15" Laptop', 'category' => 'คอมพิวเตอร์', 'unit' => 'เครื่อง', 'purchase_price' => 25000, 'sale_price' => 29900],
            ['code' => 'P-0007', 'name_th' => 'โต๊ะทำงาน', 'name_en' => 'Office Desk', 'category' => 'เฟอร์นิเจอร์', 'unit' => 'ตัว', 'purchase_price' => 3500, 'sale_price' => 4900],
            ['code' => 'P-0008', 'name_th' => 'เก้าอี้สำนักงาน', 'name_en' => 'Office Chair', 'category' => 'เฟอร์นิเจอร์', 'unit' => 'ตัว', 'purchase_price' => 2200, 'sale_price' => 3200],
            ['code' => 'P-0009', 'name_th' => 'ฮาร์ดดิสก์ 1TB', 'name_en' => '1TB Hard Drive', 'category' => 'อุปกรณ์', 'unit' => 'ลูก', 'purchase_price' => 1500, 'sale_price' => 2100],
            ['code' => 'P-0010', 'name_th' => 'สาย LAN', 'name_en' => 'LAN Cable', 'category' => 'อุปกรณ์', 'unit' => 'เส้น', 'purchase_price' => 80, 'sale_price' => 150],
        ];
        foreach ($products as $product) {
            Product::updateOrCreate(['code' => $product['code']], $product);
        }

        // คู่ค้า
        $partners = [
            ['type' => 'customer', 'code' => 'C-0001', 'name' => 'บริษัท ไทยเทรด จำกัด', 'tax_id' => '0105555000011', 'address' => 'กรุงเทพมหานคร', 'phone' => '02-111-1111', 'email' => 'contact@thaithai.co.th'],
            ['type' => 'customer', 'code' => 'C-0002', 'name' => 'ห้างหุ้นส่วนจำกัด ศรีสวัสดิ์พานิช', 'tax_id' => '0103556000022', 'address' => 'เชียงใหม่', 'phone' => '053-222-222', 'email' => 'info@sisawat.co.th'],
            ['type' => 'customer', 'code' => 'C-0003', 'name' => 'บริษัท นครคอมพิวเตอร์ จำกัด', 'tax_id' => '0105557000033', 'address' => 'ขอนแก่น', 'phone' => '043-333-333', 'email' => 'sales@nakhonpc.co.th'],
            ['type' => 'supplier', 'code' => 'S-0001', 'name' => 'บริษัท เอเชียไอที ซัพพลาย จำกัด', 'tax_id' => '0105548000044', 'address' => 'สมุทรปราการ', 'phone' => '02-444-4444', 'email' => 'sales@asiait.co.th'],
            ['type' => 'supplier', 'code' => 'S-0002', 'name' => 'บริษัท เฟอร์นิเจอร์สยาม จำกัด', 'tax_id' => '0105549000055', 'address' => 'ปทุมธานี', 'phone' => '02-555-5555', 'email' => 'office@siamfurniture.co.th'],
            ['type' => 'supplier', 'code' => 'S-0003', 'name' => 'ห้างหุ้นส่วนจำกัด อุปกรณ์เน็ตเวิร์ก', 'tax_id' => '0103550000066', 'address' => 'นนทบุรี', 'phone' => '02-666-6666', 'email' => 'sales@networkshop.co.th'],
        ];
        foreach ($partners as $partner) {
            Partner::updateOrCreate(['code' => $partner['code']], $partner);
        }

        // อัตราภาษีหัก ณ ที่จ่าย
        $whtRates = [
            ['name' => 'ค่าสินค้า', 'rate' => 1, 'type' => 'goods'],
            ['name' => 'ค่าบริการ', 'rate' => 3, 'type' => 'service'],
            ['name' => 'ค่าจ้างทำของ / บริการวิชาชีพ', 'rate' => 3, 'type' => 'service'],
            ['name' => 'ค่าเช่า', 'rate' => 5, 'type' => 'service'],
            ['name' => 'ค่าขนส่ง', 'rate' => 1, 'type' => 'goods'],
        ];
        foreach ($whtRates as $whtRate) {
            WithholdingTaxRate::updateOrCreate(
                ['name' => $whtRate['name']],
                $whtRate
            );
        }

        // ตั้งค่าระบบ
        Setting::set('company', [
            'name' => 'บริษัท เซม อีอาร์พี จำกัด',
            'address' => '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
            'tax_id' => '0105559000000',
            'phone' => '02-000-0000',
            'email' => 'info@zemerp.com',
            'logo' => '',
        ]);
        Setting::set('vat_rate', 7);
        Setting::set('document_footer', 'ขอบคุณที่ใช้บริการ');
        Setting::set('gl_accounts', [
            'cash' => '1102',
            'accounts_receivable' => '1200',
            'inventory' => '1300',
            'vat_input' => '1400',
            'wht_receivable' => '1500',
            'accounts_payable' => '2100',
            'vat_output' => '2200',
            'wht_payable' => '2300',
            'sales_revenue' => '4100',
            'cogs' => '5100',
        ]);
    }
}
