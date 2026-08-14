# ZemERP — ระบบบริหารจัดการ ERP (Laravel + React)

ระบบ ERP ครบวงจรสำหรับธุรกิจ SMEs: ซื้อ, ขาย, คลังสินค้า, บัญชีแยกประเภท (ผังบัญชี), ภาษีซื้อ/ขาย, ภาษีหัก ณ ที่จ่าย, รับเงิน/ชำระเงิน, พิมพ์เอกสาร และรายงานสรุป

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
|---|---|
| Backend | Laravel 12 (REST API) + MySQL 8 — รันผ่าน **Docker Compose** |
| Frontend | React 19 + Vite + Tailwind CSS 4 — SPA แยกจาก backend |
| Auth | Laravel Sanctum (Bearer Token) |
| ภาษา UI | ไทย / อังกฤษ (สลับได้จากแถบด้านบน) |
| เอกสารพิมพ์ | พิมพ์ผ่านเบราว์เซอร์ (A4) |

## สิ่งที่ต้องเตรียม

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — **ต้องรันในโหมด Linux containers**
  > Windows: คลิกขวาที่ไอคอน Docker Desktop ที่ System Tray → **Switch to Linux containers…**
- [Node.js](https://nodejs.org/) v18+ (สำหรับรัน Frontend)

## วิธีรัน (First run)

```bash
# 1. โคลนโปรเจกต์
git clone https://github.com/zemscigit/ZemERP.git
cd ZemERP

# 2. รัน Backend (MySQL + Laravel) — ครั้งแรกจะ build image,
#    composer install + สร้าง .env อัตโนมัติ + migrate + seed ข้อมูลตัวอย่าง
docker compose up -d --build

# ตรวจสอบว่า backend พร้อม (ดู log จนขึ้น "Application up")
docker compose logs -f app

# 3. รัน Frontend
cd frontend
npm install
npm run dev
```

เปิดใช้งาน:
- **Frontend (UI):** http://localhost:5173
- **Backend API:** http://localhost:8000/api
- **Health check:** http://localhost:8000/up

> 💡 ครั้งแรกอาจใช้เวลา 3–5 นาที (build image + composer install) — ครั้งต่อๆ ไปแค่ `docker compose up -d` ก็เร็ว

### ผู้ใช้ทดสอบ (seed อัตโนมัติ)

| อีเมล | รหัสผ่าน | สิทธิ์ |
|---|---|---|
| admin@zemerp.com | password | ผู้ดูแลระบบ |
| staff@zemerp.com | password | พนักงาน |

### ข้อมูลตัวอย่างที่ seed ให้อัตโนมัติ
- ผังบัญชีมาตรฐานไทย 17 บัญชี
- สินค้า 10 รายการ, คู่ค้า (ลูกค้า/ผู้ขาย) 6 ราย, คลัง 1 แห่ง, อัตราหัก ณ ที่จ่าย
- ธุรกรรมตัวอย่างครบวงจร 1 ชุด (PO → รับสินค้า → ใบกำกับภาษีซื้อ → ชำระเงิน / SO → ส่งสินค้า → ใบแจ้งหนี้ → รับเงิน)

## โครงสร้างโปรเจกต์

```
├── backend/          # Laravel API (Docker)
│   ├── app/          # Models, Controllers, Services
│   ├── database/     # Migrations + Seeders (ผังบัญชี, ข้อมูลตัวอย่าง)
│   └── routes/api.php
├── frontend/         # React SPA (Vite)
│   └── src/pages/    # หน้าต่างๆ (ซื้อ/ขาย/คลัง/บัญชี/รายงาน/ตั้งค่า)
├── docker/app/       # Dockerfile PHP 8.3 (pdo_mysql, gd, opcache)
└── docker-compose.yml
```

## ฟังก์ชันหลัก

- **ข้อมูลหลัก**: สินค้า (พร้อมรูป), คู่ค้า (ลูกค้า/ผู้ขาย), ผังบัญชี, คลังสินค้า, อัตราภาษีหัก ณ ที่จ่าย
- **ซื้อ**: ใบสั่งซื้อ (PO) → รับสินค้าเข้าคลัง → ใบกำกับภาษีซื้อ → ชำระเงิน (หัก ณ ที่จ่าย)
- **ขาย**: ใบสั่งขาย (SO) → ใบส่งสินค้า (ตัดสต็อก + COGS) → ใบแจ้งหนี้/ใบกำกับภาษี → รับเงิน + ใบเสร็จรับเงิน
- **คลัง**: การเคลื่อนไหวสต็อก, ปรับยอดสต็อก, ต้นทุนถัวเฉลี่ย (Moving Average), บัตรสต็อก
- **บัญชี**: ลงบัญชีอัตโนมัติทุกเอกสาร (GL Posting), บันทึกรายการบัญชีมือ, งบทดลอง, ทะเบียนบัญชี
- **ภาษี**: ภาษีซื้อ/ภาษีขาย (VAT 7%), ภาษีหัก ณ ที่จ่าย (WHT) — รายงานแยก
- **พิมพ์เอกสาร**: ใบสั่งซื้อ, ใบสั่งขาย, ใบส่งสินค้า, ใบแจ้งหนี้/ใบกำกับภาษี, ใบเสร็จรับเงิน (A4)
- **รายงาน**: ยอดขาย, ยอดซื้อ, ภาษีซื้อ/ขาย, สต็อก, การเคลื่อนไหวสต็อก, บัตรสต็อก, WHT, Dashboard
- **สิทธิ์**: admin / staff (staff เข้าไม่ได้ในหน้าจัดการผู้ใช้)

## ตั้งค่าเพิ่มเติม

- **ข้อมูลบริษัท** (ชื่อ, เลขภาษี, ที่อยู่, อัตรา VAT) → **ตั้งค่า > ข้อมูลบริษัท** (แสดงบนเอกสารพิมพ์)
- **การแมปบัญชี GL** (ลูกหนี้, เจ้าหนี้, รายได้, ต้นทุนขาย, ภาษี ฯลฯ) → **ตั้งค่า > การตั้งค่าบัญชี GL**
- **ผู้ใช้ระบบ** → **ตั้งค่า > ผู้ใช้** (เฉพาะ admin)

## คำสั่งที่ใช้งานบ่อย

```bash
docker compose up -d              # เริ่มระบบ
docker compose down               # หยุดระบบ (ข้อมูล DB ยังอยู่)
docker compose down -v            # หยุด + ลบข้อมูล DB ทั้งหมด (เริ่มใหม่)
docker compose logs -f app        # ดู log backend

# ทำงานกับ backend ภายใน container
docker compose exec app php artisan migrate                  # รัน migration
docker compose exec app php artisan db:seed                  # seed ข้อมูลตัวอย่าง
docker compose exec app php artisan migrate:fresh --seed     # reset DB + seed ใหม่
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
GET /api/reports/dashboard|sales|purchases|vat|stock|stock-movements|stock-card|wht|trial-balance|ledger
```

ทุก endpoint (ยกเว้น `/login`) ต้องส่ง header `Authorization: Bearer <token>`

## แก้ปัญหาเบื้องต้น (Troubleshooting)

| อาการ | วิธีแก้ |
|---|---|
| `docker compose up` error "no matching manifest for windows/amd64" | Docker Desktop ยังอยู่ในโหมด Windows containers → สลับเป็น **Linux containers** |
| เข้า http://localhost:5173 แล้ว login ไม่ได้ / API error | ตรวจว่า backend รันอยู่: `curl http://localhost:8000/up` ควรได้ 200 |
| Port 8000 หรือ 5173 ชนกับโปรแกรมอื่น | เปลี่ยน `ports` ใน docker-compose.yml / `server.port` ใน frontend/vite.config.js |
| อยากเริ่มข้อมูลใหม่ทั้งหมด | `docker compose down -v` แล้ว `docker compose up -d --build` |
| ระบบช้าผิดปกติ (Windows) | `docker compose restart app` — vendor อยู่ใน named volume อยู่แล้ว ไม่ควรช้า |
