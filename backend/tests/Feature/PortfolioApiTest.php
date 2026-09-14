<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PortfolioApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_public_index_exposes_profile_and_content(): void
    {
        $this->getJson('/api/v1')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'profile' => ['id', 'display_name', 'headline', 'roles'],
                    'featured_projects',
                    'recent_posts',
                    'testimonials',
                    'services',
                ],
            ]);
    }

    public function test_public_skills_returns_seeded_skill_count(): void
    {
        $expected = count(\Database\Seeders\ProfileSeeder::cvData()['skills']);

        $this->getJson('/api/v1/skills')
            ->assertOk()
            ->assertJsonCount($expected, 'data.skills');
    }

    public function test_public_projects_returns_paginated_list(): void
    {
        $this->getJson('/api/v1/projects')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1);
    }

    public function test_contact_form_persists_a_message(): void
    {
        $this->postJson('/api/v1/contact', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'subject' => 'Project inquiry',
            'message' => 'Hi, I would like to discuss a project with you.',
        ])->assertCreated();

        $this->assertDatabaseHas('contact_messages', [
            'email' => 'jane@example.com',
            'subject' => 'Project inquiry',
        ]);

        $this->assertSame(1, ContactMessage::count());
    }

    public function test_admin_can_access_dashboard_with_valid_token(): void
    {
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => config('portfolio.admin_email'),
            'password' => config('portfolio.admin_password'),
        ])->assertOk();

        $token = $login->json('data.token');

        $this->withToken($token)
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_unauth_access_to_admin_redirects_to_login(): void
    {
        $this->getJson('/api/v1/admin/dashboard')
            ->assertUnauthorized();
    }

    public function test_register_creates_account_and_returns_token(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'New User',
            'email' => 'new@example.com',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
        ])
            ->assertCreated()
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $this->assertDatabaseHas('users', ['email' => 'new@example.com']);
    }

    public function test_registration_validation_rejects_bad_email(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'X',
            'email' => 'not-an-email',
            'password' => 'secret-password',
        ])->assertStatus(422);
    }
}