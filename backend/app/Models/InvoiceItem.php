<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id', 'product_id', 'description', 'qty', 'unit_price', 'vat_rate', 'amount',
    ];

    protected $casts = [
        'qty' => 'float',
        'unit_price' => 'float',
        'vat_rate' => 'float',
        'amount' => 'float',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
