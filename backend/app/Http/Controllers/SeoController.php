<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Project;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * Crawler-facing SEO endpoints (§25 of the spec).
 *
 * The sitemap is generated exclusively from real database slugs — published
 * posts and active projects plus the static SPA routes that actually exist.
 * No hardcoded placeholder URLs, so drafts/unpublished content never leak.
 * Output is cached briefly: bots request it often, it changes rarely.
 */
class SeoController extends Controller
{
    /** Cached sitemap entry TTL (minutes). */
    protected const CACHE_TTL = 360;

    public function robots(): Response
    {
        $base = $this->baseUrl();

        $lines = [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            '',
            "Sitemap: {$base}/sitemap.xml",
        ];

        return response(implode("\n", $lines))
            ->header('Content-Type', 'text/plain; charset=UTF-8');
    }

    public function sitemap(): Response
    {
        $entries = Cache::remember(
            'seo.sitemap.entries',
            now()->addMinutes(self::CACHE_TTL),
            fn (): array => $this->entries(),
        );

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        foreach ($entries as $entry) {
            $xml .= "  <url>\n";
            $xml .= '    <loc>'.e($entry['loc'])."</loc>\n";

            if (! empty($entry['lastmod'])) {
                $xml .= '    <lastmod>'.$entry['lastmod']."</lastmod>\n";
            }

            $xml .= '    <changefreq>'.$entry['changefreq']."</changefreq>\n";
            $xml .= '    <priority>'.$entry['priority']."</priority>\n";
            $xml .= "  </url>\n";
        }

        $xml .= "</urlset>\n";

        return response($xml)
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    /**
     * Build every indexable URL. Only routes that exist in the SPA router and
     * records that pass the public visibility filters are included.
     *
     * @return list<array{loc: string, lastmod: string, changefreq: string, priority: string}>
     */
    protected function entries(): array
    {
        $urls = [
            $this->entry('/', null, 'weekly', '1.0'),
            $this->entry('/projects', null, 'weekly', '0.8'),
            $this->entry('/posts', null, 'weekly', '0.8'),
            $this->entry('/services', null, 'monthly', '0.6'),
            $this->entry('/contact', null, 'monthly', '0.3'),
        ];

        $projects = Project::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->get(['slug', 'updated_at']);

        foreach ($projects as $project) {
            $urls[] = $this->entry("/projects/{$project->slug}", $project->updated_at, 'monthly', '0.7');
        }

        $posts = Post::query()
            ->published()
            ->orderByDesc('published_at')
            ->get(['slug', 'updated_at']);

        foreach ($posts as $post) {
            $urls[] = $this->entry("/posts/{$post->slug}", $post->updated_at, 'monthly', '0.6');
        }

        return $urls;
    }

    /**
     * @return array{loc: string, lastmod: string, changefreq: string, priority: string}
     */
    protected function entry(string $path, ?Carbon $lastMod, string $changeFreq, string $priority): array
    {
        return [
            'loc' => $this->baseUrl().$path,
            'lastmod' => $lastMod?->toISOString() ?? '',
            'changefreq' => $changeFreq,
            'priority' => $priority,
        ];
    }

    protected function baseUrl(): string
    {
        return rtrim((string) config('app.url'), '/');
    }
}
