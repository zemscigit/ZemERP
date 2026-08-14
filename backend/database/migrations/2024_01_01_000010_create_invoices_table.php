<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['sale', 'purchase']);
            $table->string('number')->unique();
            $table->foreignId('partner_id')->constrained('partners');
            $table->string('ref_type')->nullable(); // sales_order | purchase_order | delivery
            $table->unsignedBigInteger('ref_id')->nullable();
            $table->date('date');
            $table->date('due_date')->nullable();
            $table->enum('status', ['draft', 'issued', 'partial', 'paid', 'cancelled'])->default('draft');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('vat_rate', 5, 2)->default(7);
            $table->decimal('vat_amount', 15, 2)->default(0);
            $table->decimal('wht_rate', 5, 2)->default(0);
            $table->decimal('wht_amount', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->decimal('net_payable', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['ref_type', 'ref_id']);
            $table->index(['type', 'status']);
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description')->nullable();
            $table->decimal('qty', 15, 3)->default(1);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('vat_rate', 5, 2)->default(7);
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
    }
};
