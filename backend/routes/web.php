<?php

use App\Http\Controllers\SeoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Crawler-facing endpoints served by Laravel itself, plus a convenience
| redirect to the SPA when it runs on a separate origin (local dev with
| Vite). In production Nginx serves the built SPA directly and FRONTEND_URL
| stays unset, so "/" falls back to the welcome view.
|
*/

Route::get('/', function () {
    if ($frontend = config('portfolio.frontend_url')) {
        return redirect()->away($frontend);
    }

    return view('welcome');
});

Route::get('/robots.txt', [SeoController::class, 'robots']);
Route::get('/sitemap.xml', [SeoController::class, 'sitemap']);

