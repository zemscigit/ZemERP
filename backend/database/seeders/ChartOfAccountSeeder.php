<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class ChartOfAccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // สินทรัพย์
            ['code' => '1101', 'name_th' => 'เงินสด', 'name_en' => 'Cash', 'type' => 'asset'],
            ['code' => '1102', 'name_th' => 'เงินฝากธนาคาร', 'name_en' => 'Bank Account', 'type' => 'asset'],
            ['code' => '1200', 'name_th' => 'ลูกหนี้การค้า', 'name_en' => 'Accounts Receivable', 'type' => 'asset'],
            ['code' => '1300', 'name_th' => 'สินค้าคงคลัง', 'name_en' => 'Inventory', 'type' => 'asset'],
            ['code' => '1400', 'name_th' => 'ภาษีซื้อ (VAT Input)', 'name_en' => 'Input VAT', 'type' => 'asset'],
            ['code' => '1500', 'name_th' => 'ภาษีหัก ณ ที่จ่าย (รับ)', 'name_en' => 'Withholding Tax Receivable', 'type' => 'asset'],
            // หนี้สิน
            ['code' => '2100', 'name_th' => 'เจ้าหนี้การค้า', 'name_en' => 'Accounts Payable', 'type' => 'liability'],
            ['code' => '2200', 'name_th' => 'ภาษีขาย (VAT Output)', 'name_en' => 'Output VAT', 'type' => 'liability'],
            ['code' => '2300', 'name_th' => 'ภาษีหัก ณ ที่จ่ายค้างจ่าย', 'name_en' => 'Withholding Tax Payable', 'type' => 'liability'],
            // ส่วนของเจ้าของ
            ['code' => '3100', 'name_th' => 'ทุนเรือนหุ้น', 'name_en' => 'Share Capital', 'type' => 'equity'],
            ['code' => '3200', 'name_th' => 'กำไรสะสม', 'name_en' => 'Retained Earnings', 'type' => 'equity'],
            // รายได้
            ['code' => '4100', 'name_th' => 'รายได้ขายสินค้า', 'name_en' => 'Sales Revenue', 'type' => 'income'],
            ['code' => '4200', 'name_th' => 'รายได้อื่น', 'name_en' => 'Other Income', 'type' => 'income'],
            // ค่าใช้จ่าย
            ['code' => '5100', 'name_th' => 'ต้นทุนขาย', 'name_en' => 'Cost of Goods Sold', 'type' => 'expense'],
            ['code' => '5200', 'name_th' => 'เงินเดือนและค่าจ้าง', 'name_en' => 'Salaries and Wages', 'type' => 'expense'],
            ['code' => '5300', 'name_th' => 'ค่าเช่า', 'name_en' => 'Rent Expense', 'type' => 'expense'],
            ['code' => '5400', 'name_th' => 'ค่าใช้จ่ายเบ็ดเตล็ด', 'name_en' => 'Miscellaneous Expense', 'type' => 'expense'],
        ];

        foreach ($accounts as $account) {
            ChartOfAccount::updateOrCreate(['code' => $account['code']], $account);
        }
    }
}
