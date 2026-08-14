<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    protected $fillable = [
        'number', 'sales_order_id', 'partner_id', 'warehouse_id', 'date', 'status', 'note', 'created_by',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public const STATUSES = ['draft', 'delivered', 'cancelled'];

    public function salesOrder()
    {
        return $this->belongsTo(SalesOrder::class);
    }

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
        return $this->hasMany(DeliveryItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
