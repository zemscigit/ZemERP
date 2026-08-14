<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'type', 'number', 'partner_id', 'ref_type', 'ref_id', 'date', 'due_date', 'status',
        'subtotal', 'discount_amount', 'vat_rate', 'vat_amount', 'wht_rate', 'wht_amount',
        'total', 'net_payable', 'paid_amount', 'note', 'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'float',
        'discount_amount' => 'float',
        'vat_rate' => 'float',
        'vat_amount' => 'float',
        'wht_rate' => 'float',
        'wht_amount' => 'float',
        'total' => 'float',
        'net_payable' => 'float',
        'paid_amount' => 'float',
    ];

    public const TYPES = ['sale', 'purchase'];
    public const STATUSES = ['draft', 'issued', 'partial', 'paid', 'cancelled'];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getBalanceAttribute(): float
    {
        return max(0, $this->net_payable - $this->paid_amount);
    }
}
