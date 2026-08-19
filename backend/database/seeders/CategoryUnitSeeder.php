<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class CategoryUnitSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['code' => 'CAT-001', 'name' => 'อุปกรณ์คอมพิวเตอร์', 'description' => 'Hardware อุปกรณ์คอมพิวเตอร์ทุกชนิด'],
            ['code' => 'CAT-002', 'name' => 'ซอฟต์แวร์', 'description' => 'โปรแกรมและลิขสิทธิ์ซอฟต์แวร์'],
            ['code' => 'CAT-003', 'name' => 'เครื่องใช้สำนักงาน', 'description' => 'อุปกรณ์สำนักงานทั่วไป'],
            ['code' => 'CAT-004', 'name' => 'วัสดุสิ้นเปลือง', 'description' => 'กระดาษ หมึก คาร์ทริดจ์'],
            ['code' => 'CAT-005', 'name' => 'เฟอร์นิเจอร์', 'description' => 'โต๊ะ เก้าอี้ ตู้ ชั้นวาง'],
        ];

        foreach ($categories as $c) {
            Category::updateOrCreate(['code' => $c['code']], $c);
        }

        $units = [
            ['code' => 'UN-001', 'name' => 'ชิ้น', 'description' => 'หน่วยนับทั่วไป'],
            ['code' => 'UN-002', 'name' => 'กล่อง', 'description' => 'นับเป็นกล่อง'],
            ['code' => 'UN-003', 'name' => 'โหล', 'description' => '12 ชิ้นต่อกล่อง'],
            ['code' => 'UN-004', 'name' => 'แพ็ค', 'description' => 'นับเป็นแพ็ค'],
            ['code' => 'UN-005', 'name' => 'เมตร', 'description' => 'หน่วยความยาว'],
            ['code' => 'UN-006', 'name' => 'แผ่น', 'description' => 'กระดาษ แผ่น'],
            ['code' => 'UN-007', 'name' => 'เล่ม', 'description' => 'หนังสือ สมุด'],
            ['code' => 'UN-008', 'name' => 'ชุด', 'description' => 'เซ็ต อุปกรณ์ครบชุด'],
        ];

        foreach ($units as $u) {
            Unit::updateOrCreate(['code' => $u['code']], $u);
        }
    }
}
