# ZemERP — ระบบบริหารจัดการ ERP (Laravel + React)

ระบบ ERP ครบวงจรสำหรับธุรกิจ SMEs: ซื้อ, ขาย, คลังสินค้า, บัญชีแยกประเภท (ผังบัญชี), ภาษีซื้อ/ขาย, ภาษีหัก ณ ที่จ่าย, รับเงิน/ชำระเงิน, พิมพ์เอกสาร และรายงานสรุป

## เทคโนโลยี
- **Backend**: Laravel 11 (REST API) + MySQL 8 — รันผ่าน Docker
- **Frontend**: React 19 + Vite + Tailwind CSS 4 — แยกเป็น SPA
- **Auth**: Laravel Sanctum (Bearer Token)
- **ภาษา UI**: ไทย / อังกฤษ (สลับได้จากแถบด้านบน)

## โครงสร้าง
```
├── backend/          # Laravel API (Docker)
├── frontend/         # React SPA (Vite)
├── docker/app/       # Dockerfile PHP 8.3
└── docker-compose.yml
```

## วิธีรัน (Docker + Node)

> ⚠️ ต้องให้ Docker Desktop รันในโหมด **Linux containers** ก่อน
> (คลิกขวาไอคอน Docker Desktop → Switch to Linux containers…)

```bash
# 1. รัน Backend (MySQL + Laravel) — ครั้งแรกจะ composer install + migrate + seed อัตโนมัติ
docker compose up -d --build

# ตรวจสอบ log
docker compose logs -f app

# 2. รัน Frontend
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api

### ผู้ใช้ทดสอบ
| อีเมล | รหัสผ่าน | สิทธิ์ |
|---|---|---|
| admin@zemerp.com | password | ผู้ดูแลระบบ |
| staff@zemerp.com | password | พนักงาน |

## ฟังก์ชันหลัก
- **ข้อมูลหลัก**: สินค้า, คู่ค้า (ลูกค้า/ผู้ขาย), ผังบัญชี, คลังสินค้า, อัตราภาษีหัก ณ ที่จ่าย
- **ซื้อ**: ใบสั่งซื้อ (PO) → รับสินค้าเข้าคลัง → ใบกำกับภาษีซื้อ → ชำระเงิน (หัก ณ ที่จ่าย)
- **ขาย**: ใบสั่งขาย (SO) → ใบส่งสินค้า (ตัดสต็อก + COGS) → ใบแจ้งหนี้/ใบกำกับภาษี → รับเงิน + ใบเสร็จรับเงิน
- **คลัง**: การเคลื่อนไหวสต็อก, ปรับยอดสต็อก, ต้นทุนถัวเฉลี่ย (Moving Average)
- **บัญชี**: ลงบัญชีอัตโนมัติทุกเอกสาร (GL Posting), บันทึกรายการบัญชีมือ, งบทดลอง, ทะเบียนบัญชี
- **ภาษี**: ภาษีซื้อ/ภาษีขาย (VAT 7%), ภาษีหัก ณ ที่จ่าย (WHT) — รายงานแยก
- **พิมพ์เอกสาร**: ใบสั่งซื้อ, ใบสั่งขาย, ใบส่งสินค้า, ใบแจ้งหนี้/ใบกำกับภาษี, ใบเสร็จรับเงิน (A4)
- **รายงาน**: ยอดขาย, ยอดซื้อ, ภาษีซื้อ/ขาย, สต็อก, WHT, Dashboard

## ตั้งค่าเพิ่มเติม
- ข้อมูลบริษัท (ชื่อ, เลขภาษี, ที่อยู่) → **ตั้งค่า > ข้อมูลบริษัท** (แสดงบนเอกสารพิมพ์)
- การแมปบัญชี GL (ลูกหนี้, เจ้าหนี้, รายได้, ต้นทุนขาย, ภาษี ฯลฯ) → **ตั้งค่า > การตั้งค่าบัญชี GL**

## คำสั่งเพิ่มเติม (backend)
```bash
docker compose exec app php artisan migrate        # รัน migration
docker compose exec app php artisan db:seed        # seed ข้อมูลตัวอย่าง
docker compose exec app php artisan migrate:fresh --seed   # reset + seed ใหม่
```

## API หลัก
```
POST /api/login
GET/POST/PUT/DELETE /api/products, /api/partners, /api/warehouses, /api/chart-of-accounts, /api/tax-rates
GET/POST /api/purchase-orders  | POST /api/purchase-orders/{id}/confirm|receive|cancel
GET/POST /api/sales-orders     | POST /api/sales-orders/{id}/confirm|cancel
GET/POST /api/deliveries       | POST /api/deliveries/{id}/complete|cancel
GET/POST /api/invoices         | POST /api/invoices/{id}/issue|cancel
GET/POST /api/payments, /api/receipts
GET/POST /api/journal-entries, /api/stock-movements
GET /api/reports/dashboard|sales|purchases|vat|stock|wht|trial-balance|ledger
```
