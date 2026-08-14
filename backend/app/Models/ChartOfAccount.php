<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChartOfAccount extends Model
{
    protected $fillable = [
        'code', 'name_th', 'name_en', 'type', 'parent_code', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public const TYPES = ['asset', 'liability', 'equity', 'income', 'expense'];

    public function parent()
    {
        return $this->belongsTo(ChartOfAccount::class, 'parent_code', 'code');
    }

    public function children()
    {
        return $this->hasMany(ChartOfAccount::class, 'parent_code', 'code');
    }
}
