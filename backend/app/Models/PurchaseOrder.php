<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'number', 'partner_id', 'warehouse_id', 'date', 'expected_date', 'status',
        'subtotal', 'discount_amount', 'vat_amount', 'total', 'note', 'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'expected_date' => 'date',
        'subtotal' => 'float',
        'discount_amount' => 'float',
        'vat_amount' => 'float',
        'total' => 'float',
    ];

    public const STATUSES = ['draft', 'confirmed', 'received', 'cancelled'];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
