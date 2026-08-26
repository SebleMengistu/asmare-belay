<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Contract for the web (non-API) routes served by Laravel itself.
 */
class WebRoutesTest extends TestCase
{
    public function test_root_redirects_to_the_spa_when_frontend_url_is_configured(): void
    {
        // Typical local development: Vite owns :5174, Laravel owns :8000.
        config()->set('portfolio.frontend_url', 'http://localhost:5174');

        $this->get('/')
            ->assertRedirect('http://localhost:5174');
    }

    public function test_root_renders_welcome_view_without_a_frontend_url(): void
    {
        // Production posture: Nginx serves the built SPA at "/" itself.
        config()->set('portfolio.frontend_url', null);

        $this->get('/')
            ->assertOk()
            ->assertViewIs('welcome');
    }
}
