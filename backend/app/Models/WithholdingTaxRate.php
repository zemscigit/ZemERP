<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WithholdingTaxRate extends Model
{
    protected $fillable = ['name', 'rate', 'type', 'is_active'];

    protected $casts = [
        'rate' => 'float',
        'is_active' => 'boolean',
    ];
}
