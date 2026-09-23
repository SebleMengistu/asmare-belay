<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profile_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('summary')->nullable();
            $table->longText('description')->nullable();
            $table->string('category')->nullable(); // web | modeling | research | water | open-source
            $table->string('repo_url')->nullable();
            $table->string('demo_url')->nullable();
            $table->json('tech_stack')->nullable();
            $table->boolean('featured')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('project_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->unique(['project_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_skill');
        Schema::dropIfExists('projects');
    }
};