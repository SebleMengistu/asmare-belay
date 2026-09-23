<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\Project;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
        config()->set('app.url', 'https://asmare.example.test');
    }

    public function test_robots_txt_disallows_admin_and_links_the_sitemap(): void
    {
        $response = $this->get('/robots.txt');

        $response->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8');

        $this->assertStringContainsString('Disallow: /admin', $response->getContent());
        $this->assertStringContainsString(
            'Sitemap: https://asmare.example.test/sitemap.xml',
            $response->getContent(),
        );
    }

    public function test_sitemap_includes_static_routes_and_published_slugs(): void
    {
        $project = Project::query()->where('is_active', true)->firstOrFail();
        $post = Post::query()->published()->firstOrFail();

        $response = $this->get('/sitemap.xml');

        $response->assertOk();

        $body = $response->getContent();
        $this->assertStringContainsString('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', $body);

        foreach ([
            'https://asmare.example.test/',
            'https://asmare.example.test/projects',
            'https://asmare.example.test/posts',
            'https://asmare.example.test/services',
            'https://asmare.example.test/contact',
            'https://asmare.example.test/projects/'.$project->slug,
            'https://asmare.example.test/posts/'.$post->slug,
        ] as $loc) {
            $this->assertStringContainsString("<loc>{$loc}</loc>", $body);
        }
    }

    public function test_sitemap_excludes_deactivated_projects(): void
    {
        $slugs = Project::query()->where('is_active', true)->pluck('slug')->all();
        $this->assertNotEmpty($slugs);

        Project::query()->update(['is_active' => false]);

        $body = $this->get('/sitemap.xml')->getContent();

        foreach ($slugs as $slug) {
            $this->assertStringNotContainsString("/projects/{$slug}</loc>", $body);
        }
    }
}
