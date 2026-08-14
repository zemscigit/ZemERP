<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'code', 'barcode', 'name_th', 'name_en', 'category', 'unit', 'image', 'purchase_price', 'sale_price', 'is_active',
    ];

    protected $casts = [
        'purchase_price' => 'float',
        'sale_price' => 'float',
        'is_active' => 'boolean',
    ];

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * คำนวณยอดคงเหลือสต็อกทั้งหมด
     */
    public function stockOnHand(?int $warehouseId = null): float
    {
        return $this->stockMovements()
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->sum('qty');
    }

    public function getStockOnHandAttribute(): float
    {
        return $this->stockOnHand();
    }
}
