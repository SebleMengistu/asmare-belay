<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Project extends Model implements HasMedia
{
    use HasFactory, HasSlug, InteractsWithMedia;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'profile_id', 'title', 'slug', 'summary', 'description', 'category',
        'repo_url', 'demo_url', 'tech_stack', 'featured', 'start_date',
        'end_date', 'display_order', 'is_active',
    ];

    protected $casts = [
        'tech_stack' => 'array',
        'featured' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class);
    }

    public function getAllMedia(): MorphMany
    {
        return parent::getAllMedia();
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('screenshots')
            ->registerMediaConversions(function (Media $media): void {
                $this->addMediaConversion('thumb')->width(480)->sharpen(8);
                $this->addMediaConversion('card')->width(800);
                $this->addMediaConversion('hero')->width(1600);
            });
    }
}