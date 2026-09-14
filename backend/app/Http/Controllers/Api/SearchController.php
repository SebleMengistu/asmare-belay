<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\PublicationResource;
use App\Http\Resources\ServiceResource;
use App\Http\Responses\ApiResponse;
use App\Models\Post;
use App\Models\Project;
use App\Models\Publication;
use App\Models\Service;
use App\Support\PortfolioCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return $this->ok([
                'query' => $q,
                'projects' => [],
                'posts' => [],
                'publications' => [],
                'services' => [],
            ]);
        }

        $payload = PortfolioCache::remember('search', function () use ($q) {
            $term = "%{$q}%";

            $projects = Project::query()
                ->with('skills')
                ->where('is_active', true)
                ->where(function ($qb) use ($term, $q) {
                    $qb->where('title', 'like', $term)
                        ->orWhere('summary', 'like', $term)
                        ->orWhere('description', 'like', $term)
                        ->orWhere('category', 'like', $term)
                        ->orWhereJsonContains('tech_stack', $q);
                })
                ->orderByDesc('created_at')
                ->limit(10)
                ->get();

            $posts = Post::published()
                ->with('tags')
                ->where(function ($qb) use ($term) {
                    $qb->where('title', 'like', $term)
                        ->orWhere('excerpt', 'like', $term)
                        ->orWhere('body', 'like', $term);
                })
                ->orderByDesc('published_at')
                ->limit(10)
                ->get();

            $publications = Publication::query()
                ->where('is_active', true)
                ->where(function ($qb) use ($term) {
                    $qb->where('title', 'like', $term)
                        ->orWhere('authors', 'like', $term)
                        ->orWhere('venue', 'like', $term)
                        ->orWhere('abstract', 'like', $term);
                })
                ->orderByDesc('created_at')
                ->limit(8)
                ->get();

            $services = Service::query()
                ->where('is_active', true)
                ->where(function ($qb) use ($term) {
                    $qb->where('title', 'like', $term)
                        ->orWhere('summary', 'like', $term)
                        ->orWhere('description', 'like', $term);
                })
                ->orderBy('display_order')
                ->limit(8)
                ->get();

            return [
                'query' => $q,
                'projects' => ProjectResource::collection($projects)->resolve(),
                'posts' => PostResource::collection($posts)->resolve(),
                'publications' => PublicationResource::collection($publications)->resolve(),
                'services' => ServiceResource::collection($services)->resolve(),
            ];
        }, mb_strtolower($q), 120);

        return $this->ok($payload);
    }
}
