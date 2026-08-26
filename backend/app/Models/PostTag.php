<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostTag extends Model
{
    use HasFactory, HasSlug;

    /**
     * @var list<string>
     */
    protected $fillable = ['name', 'slug'];
}