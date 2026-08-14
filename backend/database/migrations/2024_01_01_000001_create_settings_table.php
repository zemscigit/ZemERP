<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->timestamps();
        });

        Schema::create('doc_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('prefix');
            $table->string('year_month', 7); // YYYY-MM
            $table->unsignedBigInteger('last_number')->default(0);
            $table->unique(['prefix', 'year_month']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doc_sequences');
        Schema::dropIfExists('settings');
    }
};
