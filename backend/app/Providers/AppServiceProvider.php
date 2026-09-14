<?php

namespace App\Providers;

use App\Models\Certification;
use App\Models\Education;
use App\Models\Experience;
use App\Models\MediaLibrary;
use App\Models\Post;
use App\Models\Profile;
use App\Models\Project;
use App\Models\Publication;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Skill;
use App\Models\Testimonial;
use App\Support\PortfolioCache;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Models whose writes (or deletes) change what the public read endpoints
     * return. Any mutation flushes the public payload cache so admin edits are
     * visible immediately instead of lingering for the TTL.
     */
    private const CONTENT_MODELS = [
        Certification::class,
        Education::class,
        Experience::class,
        MediaLibrary::class,
        Post::class,
        Profile::class,
        Project::class,
        Publication::class,
        Service::class,
        Setting::class,
        Skill::class,
        Testimonial::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        foreach (self::CONTENT_MODELS as $model) {
            $model::saved(fn () => PortfolioCache::flush());
            $model::deleted(fn () => PortfolioCache::flush());
        }
    }
}