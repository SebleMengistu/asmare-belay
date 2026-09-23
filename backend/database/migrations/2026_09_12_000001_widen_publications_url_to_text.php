<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publications', function (Blueprint $table) {
            // Modifiers must be re-declared when changing a column, otherwise
            // the recreated column loses its NULL default (SQLite inserts fail).
            $table->text('url')->nullable()->change();
            $table->text('doi')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('publications', function (Blueprint $table) {
            $table->string('url')->nullable()->change();
            $table->string('doi')->nullable()->change();
        });
    }
};
