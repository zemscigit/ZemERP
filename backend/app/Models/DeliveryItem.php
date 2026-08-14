<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryItem extends Model
{
    protected $fillable = ['delivery_id', 'product_id', 'qty', 'unit_price', 'amount'];

    protected $casts = [
        'qty' => 'float',
        'unit_price' => 'float',
        'amount' => 'float',
    ];

    public function delivery()
    {
        return $this->belongsTo(Delivery::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
