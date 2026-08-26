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
        config()->set('app.url', 'https://tefera.example.test');
    }

    public function test_robots_txt_disallows_admin_and_links_the_sitemap(): void
    {
        $response = $this->get('/robots.txt');

        $response->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8');

        $this->assertStringContainsString('Disallow: /admin', $response->getContent());
        $this->assertStringContainsString(
            'Sitemap: https://tefera.example.test/sitemap.xml',
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
            'https://tefera.example.test/',
            'https://tefera.example.test/projects',
            'https://tefera.example.test/posts',
            'https://tefera.example.test/services',
            'https://tefera.example.test/contact',
            'https://tefera.example.test/projects/'.$project->slug,
            'https://tefera.example.test/posts/'.$post->slug,
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
