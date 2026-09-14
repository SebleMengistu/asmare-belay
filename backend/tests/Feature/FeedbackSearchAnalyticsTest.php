<?php

namespace Tests\Feature;

use App\Models\AnalyticsEvent;
use App\Models\ContactMessage;
use App\Models\Feedback;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class FeedbackSearchAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_feedback_form_persists_a_record(): void
    {
        $this->postJson('/api/v1/feedback', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'category' => 'general',
            'rating' => 5,
            'message' => 'Great portfolio, loved the Odoo case studies.',
        ])->assertCreated();

        $this->assertDatabaseHas('feedback', [
            'email' => 'jane@example.com',
            'rating' => 5,
        ]);

        $this->assertSame(1, Feedback::count());
    }

    public function test_feedback_validation_requires_message(): void
    {
        $this->postJson('/api/v1/feedback', ['message' => ''])
            ->assertStatus(422);
    }

    public function test_global_search_returns_matching_content(): void
    {
        $response = $this->getJson('/api/v1/search?q=Odoo')
            ->assertOk();

        $data = $response->json('data');
        $this->assertArrayHasKey('projects', $data);
        $this->assertArrayHasKey('posts', $data);
        $this->assertArrayHasKey('publications', $data);
        $this->assertArrayHasKey('services', $data);
    }

    public function test_global_search_short_query_returns_empty(): void
    {
        $this->getJson('/api/v1/search?q=a')
            ->assertOk()
            ->assertJsonPath('data.projects', []);
    }

    public function test_admin_can_access_analytics_overview(): void
    {
        AnalyticsEvent::create([
            'event' => 'pageview',
            'path' => '/',
            'ip' => hash('sha256', '1.2.3.4'),
            'occurred_at' => now(),
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => config('portfolio.admin_email'),
            'password' => config('portfolio.admin_password'),
        ])->assertOk();

        $token = $login->json('data.token');

        $this->withToken($token)
            ->getJson('/api/v1/admin/analytics/overview')
            ->assertOk()
            ->assertJsonPath('data.totals.pageviews', 1)
            ->assertJsonPath('success', true);
    }

    public function test_analytics_overview_requires_auth(): void
    {
        $this->getJson('/api/v1/admin/analytics/overview')
            ->assertUnauthorized();
    }

    public function test_admin_can_list_and_manage_feedback(): void
    {
        Feedback::create([
            'name' => 'A. Client',
            'category' => 'development',
            'rating' => 4,
            'message' => 'Solid work on the ERP customisation.',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => config('portfolio.admin_email'),
            'password' => config('portfolio.admin_password'),
        ])->assertOk();

        $token = $login->json('data.token');

        $this->withToken($token)
            ->getJson('/api/v1/admin/feedback')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1);

        $this->withToken($token)
            ->getJson('/api/v1/admin/feedback/stats')
            ->assertOk()
            ->assertJsonPath('data.unread', 1);
    }

    public function test_admin_can_upload_and_list_media(): void
    {
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => config('portfolio.admin_email'),
            'password' => config('portfolio.admin_password'),
        ])->assertOk();

        $token = $login->json('data.token');

        $this->withToken($token)
            ->post('/api/v1/admin/media', [
                'media' => UploadedFile::fake()->image('photo.png', 8, 8),
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.mime_type', 'image/png');

        $this->withToken($token)
            ->getJson('/api/v1/admin/media')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonStructure(['data' => [['id', 'url', 'thumb']]]);

        $mediaId = \Spatie\MediaLibrary\MediaCollections\Models\Media::query()->value('id');

        $this->withToken($token)
            ->deleteJson('/api/v1/admin/media/'.$mediaId)
            ->assertStatus(204);
    }
}
