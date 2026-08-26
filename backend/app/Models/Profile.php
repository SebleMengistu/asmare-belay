<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Profile extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id', 'first_name', 'last_name', 'display_name', 'headline',
        'tagline', 'bio', 'location', 'website', 'email_public', 'phone',
        'github', 'linkedin', 'twitter', 'whatsapp', 'roles',
        'available_for_work', 'meta',
    ];

    protected $casts = [
        'roles' => 'array',
        'meta' => 'array',
        'available_for_work' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function skills()
    {
        return $this->hasMany(Skill::class);
    }

    public function experiences()
    {
        return $this->hasMany(Experience::class);
    }

    public function educations()
    {
        return $this->hasMany(Education::class);
    }

    public function certifications()
    {
        return $this->hasMany(Certification::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function publications()
    {
        return $this->hasMany(Publication::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function testimonials()
    {
        return $this->hasMany(Testimonial::class);
    }

    public function getAllMedia(): MorphMany
    {
        return parent::getAllMedia();
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')
            ->singleFile()
            ->acceptsFile(fn ($file) => in_array($file->getMimeType(), [
                'image/jpeg', 'image/png', 'image/webp', 'image/avif',
            ], true))
            ->registerMediaConversions(function (Media $media): void {
                $this->addMediaConversion('thumb')->width(320)->height(320)->sharpen(10);
                $this->addMediaConversion('card')->width(640);
            });

        $this->addMediaCollection('resume')->acceptsFile(fn ($file) => in_array($file->getMimeType(), [
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ], true));

        $this->addMediaCollection('cover')->singleFile()
            ->registerMediaConversions(function (Media $media): void {
                $this->addMediaConversion('hero')->width(1600);
            });
    }
}