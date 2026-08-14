<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'type', 'number', 'partner_id', 'invoice_id', 'date', 'amount', 'wht_amount',
        'method', 'reference', 'note', 'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'float',
        'wht_amount' => 'float',
    ];

    public const TYPES = ['in', 'out'];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function receipt()
    {
        return $this->hasOne(Receipt::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
