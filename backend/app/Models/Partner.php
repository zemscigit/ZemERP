<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Partner extends Model
{
    protected $fillable = [
        'type', 'code', 'name', 'tax_id', 'address', 'phone', 'email', 'contact_person', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public const TYPES = ['customer', 'supplier', 'both'];

    public function scopeCustomers($q)
    {
        return $q->whereIn('type', ['customer', 'both']);
    }

    public function scopeSuppliers($q)
    {
        return $q->whereIn('type', ['supplier', 'both']);
    }
}
