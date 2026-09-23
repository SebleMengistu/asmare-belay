<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Portfolio Application
    |--------------------------------------------------------------------------
    |
    | Console/seed defaults for the portfolio's primary operator account and
    | SEO identity. These are resolved from env so credentials are never
    | committed to the repository.
    |
    */

    'admin_email' => env('ADMIN_EMAIL', 'admin@asmarebelay.dev'),
    'admin_name' => env('ADMIN_NAME', 'ASMARE Admin'),
    'admin_password' => env('ADMIN_PASSWORD', 'change-me-now'),

    // Absolute URL of the Vue SPA when hosted on a different origin than the
    // API (local development). Empty in production, where Nginx serves both.
    'frontend_url' => env('FRONTEND_URL'),

    'seo' => [
        'title' => env('SEO_TITLE', 'ASMARE — Hydrology & Water Resources Engineer'),
        'description' => env('SEO_DESCRIPTION', 'Portfolio of a Hydrology & Water Resources Engineer, Lecturer and Researcher.'),
        'keywords' => env('SEO_KEYWORDS'),
        'image' => env('SEO_IMAGE'),
    ],

];