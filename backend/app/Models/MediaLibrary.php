<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Generic holder for media uploaded from the admin media library that is not
 * attached to any specific content record (standalone uploads). Content-bound
 * media (project screenshots, post covers, profile images) remains attached to
 * their owning models; the library also lists and manages those.
 */
class MediaLibrary extends Model implements HasMedia
{
    use InteractsWithMedia;

    public function getAllMedia(): MorphMany
    {
        return parent::getAllMedia();
    }

    public function registerMediaConversions(Media $media = null): void
    {
        // No global conversions for arbitrary uploads.
    }
}
