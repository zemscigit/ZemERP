<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'product_id', 'warehouse_id', 'qty', 'unit_cost', 'type', 'ref_type', 'ref_id', 'date', 'note', 'created_by',
    ];

    protected $casts = [
        'qty' => 'float',
        'unit_cost' => 'float',
        'date' => 'date',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
