<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Service extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'profile_id', 'title', 'slug', 'summary', 'description', 'icon',
        'price_from', 'currency', 'delivery', 'features', 'cta_label',
        'display_order', 'is_active',
    ];

    protected $casts = [
        'price_from' => 'decimal:2',
        'features' => 'array',
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}