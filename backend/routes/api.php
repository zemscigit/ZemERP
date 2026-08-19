<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChartOfAccountController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\JournalEntryController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SalesOrderController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StockMovementController;
use App\Http\Controllers\Api\TaxRateController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\UnitController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->name('login');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Master Data
    Route::apiResource('products', ProductController::class);
    Route::apiResource('partners', PartnerController::class);
    Route::get('chart-of-accounts', [ChartOfAccountController::class, 'index']);
    Route::post('chart-of-accounts', [ChartOfAccountController::class, 'store']);
    Route::put('chart-of-accounts/{chartOfAccount}', [ChartOfAccountController::class, 'update']);
    Route::delete('chart-of-accounts/{chartOfAccount}', [ChartOfAccountController::class, 'destroy']);
    Route::apiResource('warehouses', WarehouseController::class);
    Route::apiResource('categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('units', UnitController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('tax-rates', TaxRateController::class);
    Route::apiResource('users', UserController::class)->except(['show'])->middleware('admin');

    // ซื้อ
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
    Route::post('purchase-orders/{purchaseOrder}/confirm', [PurchaseOrderController::class, 'confirm']);
    Route::post('purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
    Route::post('purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel']);

    // ขาย
    Route::apiResource('sales-orders', SalesOrderController::class);
    Route::post('sales-orders/{salesOrder}/confirm', [SalesOrderController::class, 'confirm']);
    Route::post('sales-orders/{salesOrder}/cancel', [SalesOrderController::class, 'cancel']);
    Route::apiResource('deliveries', DeliveryController::class);
    Route::post('deliveries/{delivery}/complete', [DeliveryController::class, 'complete']);
    Route::post('deliveries/{delivery}/cancel', [DeliveryController::class, 'cancel']);

    // ใบแจ้งหนี้ (ขาย/ซื้อ) + ภาษี
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('invoices/{invoice}/issue', [InvoiceController::class, 'issue']);
    Route::post('invoices/{invoice}/cancel', [InvoiceController::class, 'cancel']);

    // เงิน
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('receipts', ReceiptController::class)->only(['index', 'show']);

    // สต็อก
    Route::get('stock-movements', [StockMovementController::class, 'index']);
    Route::post('stock-movements', [StockMovementController::class, 'store']);

    // บัญชี
    Route::apiResource('journal-entries', JournalEntryController::class)->only(['index', 'show', 'store', 'destroy']);

    // รายงาน
    Route::get('reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('reports/sales', [ReportController::class, 'sales']);
    Route::get('reports/purchases', [ReportController::class, 'purchases']);
    Route::get('reports/vat', [ReportController::class, 'vat']);
    Route::get('reports/stock', [ReportController::class, 'stock']);
    Route::get('reports/stock-movements', [ReportController::class, 'stockMovements']);
    Route::get('reports/stock-card', [ReportController::class, 'stockCard']);
    Route::get('reports/wht', [ReportController::class, 'wht']);
    Route::get('reports/gl-entries', [ReportController::class, 'glEntries']);
    Route::get('reports/trial-balance', [ReportController::class, 'trialBalance']);
    Route::get('reports/ledger', [ReportController::class, 'ledger']);

    // ตั้งค่า
    Route::get('settings', [SettingController::class, 'show']);
    Route::put('settings', [SettingController::class, 'update']);
});
