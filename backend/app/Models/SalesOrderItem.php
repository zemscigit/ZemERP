<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesOrderItem extends Model
{
    protected $fillable = [
        'sales_order_id', 'product_id', 'qty', 'unit_price', 'vat_rate', 'amount',
    ];

    protected $casts = [
        'qty' => 'float',
        'unit_price' => 'float',
        'vat_rate' => 'float',
        'amount' => 'float',
    ];

    public function salesOrder()
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
