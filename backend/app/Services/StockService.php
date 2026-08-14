<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class StockService
{
    /**
     * บันทึกการเคลื่อนไหวสต็อก (qty เป็นบวก = เข้า, ลบ = ออก)
     */
    public static function move(
        Product $product,
        float $qty,
        string $type,
        ?string $refType = null,
        ?int $refId = null,
        ?int $warehouseId = null,
        float $unitCost = 0,
        ?string $date = null,
        ?string $note = null,
        ?int $userId = null,
    ): StockMovement {
        if ($qty < 0 && $product->stockOnHand($warehouseId) + $qty < 0) {
            throw new RuntimeException("สต็อกไม่เพียงพอสำหรับสินค้า {$product->name_th} (คงเหลือ {$product->stockOnHand($warehouseId)})");
        }

        return StockMovement::create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouseId,
            'qty' => $qty,
            'unit_cost' => $unitCost,
            'type' => $type,
            'ref_type' => $refType,
            'ref_id' => $refId,
            'date' => $date ?? now()->toDateString(),
            'note' => $note,
            'created_by' => $userId,
        ]);
    }

    /**
     * ตรวจสอบสต็อกเพียงพอสำหรับการตัดสต็อกหลายรายการใน transaction เดียว
     */
    public static function assertStockEnough(array $lines, ?int $warehouseId = null): void
    {
        $needed = [];
        foreach ($lines as $line) {
            $needed[$line['product_id']] = ($needed[$line['product_id']] ?? 0) + $line['qty'];
        }

        foreach ($needed as $productId => $qty) {
            $product = Product::find($productId);
            if (! $product) {
                throw new RuntimeException("ไม่พบสินค้า ID {$productId}");
            }
            if ($product->stockOnHand($warehouseId) < $qty) {
                throw new RuntimeException("สต็อกไม่เพียงพอสำหรับสินค้า {$product->name_th} (คงเหลือ {$product->stockOnHand($warehouseId)} ต้องการ {$qty})");
            }
        }
    }

    /**
     * คำนวณต้นทุนถัวเฉลี่ยเคลื่อนที่ (moving average) สำหรับสินค้า
     */
    public static function averageCost(Product $product, ?int $warehouseId = null): float
    {
        $rows = StockMovement::where('product_id', $product->id)
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        $qty = 0;
        $cost = 0;
        foreach ($rows as $row) {
            if ($row->qty > 0) {
                $cost = $qty > 0
                    ? (($qty * $cost) + ($row->qty * $row->unit_cost)) / ($qty + $row->qty)
                    : $row->unit_cost;
                $qty += $row->qty;
            } else {
                $qty += $row->qty;
            }
        }

        return $qty > 0 ? round($cost, 2) : 0;
    }
}
