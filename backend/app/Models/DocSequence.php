<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocSequence extends Model
{
    protected $fillable = ['prefix', 'year_month', 'last_number'];

    protected $casts = [
        'last_number' => 'integer',
    ];
}
