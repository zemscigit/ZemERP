<?php

namespace App\Services;

use App\Models\DocSequence;
use Carbon\Carbon;

class DocumentNumberService
{
    /**
     * สร้างเลขเอกสารถัดไป รูปแบบ {PREFIX}-{YYYYMM}-{####}
     */
    public static function next(string $prefix, string|Carbon|null $date = null): string
    {
        $date = is_string($date) && $date !== '' ? Carbon::parse($date) : ($date ?? now());
        $ym = $date->format('Y-m');

        $sequence = DocSequence::lockForUpdate()
            ->firstOrCreate(
                ['prefix' => $prefix, 'year_month' => $ym],
                ['last_number' => 0]
            );

        $sequence->last_number++;
        $sequence->save();

        return sprintf('%s-%s-%04d', $prefix, $date->format('Ym'), $sequence->last_number);
    }
}
