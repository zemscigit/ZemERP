<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $fillable = ['number', 'payment_id', 'partner_id', 'date', 'amount', 'note', 'created_by'];

    protected $casts = [
        'date' => 'date',
        'amount' => 'float',
    ];

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }
}
