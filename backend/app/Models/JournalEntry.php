<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    protected $fillable = [
        'entry_number', 'date', 'description', 'type', 'ref_type', 'ref_id', 'created_by',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    protected $appends = ['total_debit', 'total_credit'];

    public const TYPES = ['sales', 'purchase', 'payment_in', 'payment_out', 'delivery', 'receipt', 'general'];

    public function lines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getTotalDebitAttribute(): float
    {
        return $this->lines->sum('debit');
    }

    public function getTotalCreditAttribute(): float
    {
        return $this->lines->sum('credit');
    }
}
