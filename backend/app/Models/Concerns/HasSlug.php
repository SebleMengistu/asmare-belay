<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * Automatically generates and persists a URL-friendly slug from the "title"
 * attribute (or the given source) when creating or expanding the translatable
 * slug. Keeps existing slugs stable.
 */
trait HasSlug
{
    public static function bootHasSlug(): void
    {
        static::saving(function ($model): void {
            if (is_null($model->slug) || trim((string) $model->slug) === '') {
                $model->slug = $model->generateUniqueSlug();
            }
        });
    }

    public function generateUniqueSlug(): string
    {
        $base = Str::slug($this->sluggableSource() ?? (string) $this->title);

        $query = static::query()->where('id', '!=', $this->id ?? 0);
        $i = 1;
        $slug = $base;

        // Re-check against a fresh (cloned) builder each iteration so the
        // candidate list stays correct for arbitrarily many duplicates.
        while ((clone $query)->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$i);
        }

        return $slug;
    }

    protected function sluggableSource(): ?string
    {
        $source = $this->attributes['title'] ?? $this->attributes['name'] ?? null;

        return $source !== null ? (string) $source : null;
    }
}