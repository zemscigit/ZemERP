<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id', 'product_id', 'qty', 'unit_price', 'vat_rate', 'amount',
    ];

    protected $casts = [
        'qty' => 'float',
        'unit_price' => 'float',
        'vat_rate' => 'float',
        'amount' => 'float',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
