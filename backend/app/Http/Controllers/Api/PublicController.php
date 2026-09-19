<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CertificationResource;
use App\Http\Resources\EducationResource;
use App\Http\Resources\ExperienceResource;
use App\Http\Resources\PostResource;
use App\Http\Resources\ProfileResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\PublicationResource;
use App\Http\Resources\ServiceResource;
use App\Http\Resources\SkillResource;
use App\Http\Resources\TestimonialResource;
use App\Http\Responses\ApiResponse;
use App\Models\Post;
use App\Models\Profile;
use App\Models\Project;
use App\Models\Publication;
use App\Models\Skill;
use App\Models\Skill as Tech;
use App\Support\PortfolioCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only endpoints consumed by the public portfolio SPA. Every resource is
 * filtered to "active" records so draft/unpublished content never leaks.
 */
class PublicController extends Controller
{
    use ApiResponse;

    protected function defaultProfile(): Profile
    {
        return PortfolioCache::remember('profile', function () {
            return Profile::query()
                ->with(['skills', 'experiences', 'educations', 'certifications'])
                ->firstOrFail();
        });
    }

    /** Homepage aggregate payload. */
    public function index(Request $request): JsonResponse
    {
        $profile = $this->defaultProfile();

        // Live stats — homepage numbers are computed straight from the database so
        // the counters are always the truth (Projects/Publications/Technologies map
        // to real tables). Years Experience & Students Trained have no source table,
        // so those stay on the stored meta value.
        // Live stats. Projects/Publications/Technologies/Years are computed straight
        // from the database so homepage counters are always the truth. Students
        // Trained has no source table, so it keeps the stored meta value.
        $experienceYears = collect($profile->experiences()->where('is_active', true)->pluck('start_date'))
            ->filter()
            ->min();
        $years = $experienceYears
            ? (int) floor(now()->diffInYears(\Illuminate\Support\Carbon::parse($experienceYears)))
            : null;

        $profile->meta = array_merge($profile->meta ?? [], [
            'projects_completed' => $profile->projects()->where('is_active', true)->count(),
            'research_publications' => $profile->publications()->where('is_active', true)->count(),
            'technologies' => $profile->skills()->where('is_active', true)->count(),
            'experience_years' => $years ?? ($profile->meta['experience_years'] ?? 0),
        ]);

        return $this->ok([
            'profile' => new ProfileResource($profile),
            'featured_projects' => PortfolioCache::remember('featured_projects', function () use ($profile) {
                $featured = $profile->projects()->with('skills')->where('featured', true)->where('is_active', true)->get();

                if ($featured->isNotEmpty()) {
                    return ProjectResource::collection($featured)->resolve();
                }

                return ProjectResource::collection(
                    $profile->projects()->with('skills')->where('is_active', true)
                        ->orderBy('display_order')->latest('created_at')->limit(6)->get()
                )->resolve();
            }, 'index'),
            'recent_posts' => PortfolioCache::remember('recent_posts', fn () => PostResource::collection(
                Post::published()->with('tags')->latest('published_at')->limit(3)->get()
            )->resolve(), 'index'),
            'testimonials' => PortfolioCache::remember('testimonials', fn () => TestimonialResource::collection(
                $profile->testimonials()->where('is_active', true)->get()
            )->resolve(), 'index'),
            'services' => PortfolioCache::remember('services', fn () => ServiceResource::collection(
                $profile->services()->where('is_active', true)->get()
            )->resolve(), 'index'),
        ]);
    }

    public function profile(int $id = 0): JsonResponse
    {
        $profile = $id > 0
            ? Profile::with(['skills', 'experiences'])->findOrFail($id)
            : $this->defaultProfile();

        return $this->ok(new ProfileResource($profile));
    }

    public function skills(): JsonResponse
    {
        $payload = PortfolioCache::remember('skills', function () {
            $profile = $this->defaultProfile();

            return [
                'skills' => SkillResource::collection($profile->skills()->where('is_active', true)->get())->resolve(),
                'experiences' => ExperienceResource::collection($profile->experiences()->where('is_active', true)->get())->resolve(),
                'educations' => EducationResource::collection($profile->educations()->where('is_active', true)->get())->resolve(),
                'certifications' => CertificationResource::collection($profile->certifications()->where('is_active', true)->get())->resolve(),
            ];
        });

        return $this->ok($payload);
    }

    public function projects(Request $request): JsonResponse
    {
        $category = $request->query('category') ?: '_all';

        $payload = PortfolioCache::remember('projects', function () use ($category) {
            $query = Project::query()->with('skills')->where('is_active', true);

            if ($category !== '_all') {
                $query->where('category', $category);
            }

            $projects = $query->orderBy('display_order')->orderByDesc('created_at')->paginate(12);

            return [
                'data' => ProjectResource::collection($projects)->resolve(),
                'pagination' => $this->paginationMeta($projects),
            ];
        }, $category);

        return $this->ok($payload['data'], 'OK', ['pagination' => $payload['pagination']]);
    }

    public function project(string $slug): JsonResponse
    {
        $project = PortfolioCache::remember('project', function () use ($slug) {
            return ProjectResource::make(
                Project::query()->with('skills')->where('is_active', true)->where('slug', $slug)->firstOrFail()
            )->resolve();
        }, $slug);

        return $this->ok($project);
    }

    public function posts(Request $request): JsonResponse
    {
        $tag = $request->query('tag') ?: '_all';

        $payload = PortfolioCache::remember('posts', function () use ($tag) {
            $query = Post::published()->with('tags');

            if ($tag !== '_all') {
                $query->whereHas('tags', fn ($q) => $q->where('slug', $tag));
            }

            $posts = $query->latest('published_at')->paginate(10);

            return [
                'data' => PostResource::collection($posts)->resolve(),
                'pagination' => $this->paginationMeta($posts),
            ];
        }, $tag);

        return $this->ok($payload['data'], 'OK', ['pagination' => $payload['pagination']]);
    }

    public function post(string $slug): JsonResponse
    {
        $post = PortfolioCache::remember('post', function () use ($slug) {
            return PostResource::make(
                Post::published()->with('tags')->where('slug', $slug)->firstOrFail()
            )->resolve();
        }, $slug);

        return $this->ok($post);
    }

    public function publications(): JsonResponse
    {
        $payload = PortfolioCache::remember('publications', function () {
            $profile = $this->defaultProfile();

            return PublicationResource::collection(
                $profile->publications()->where('is_active', true)->orderBy('display_order')->get()
            )->resolve();
        });

        return $this->ok($payload);
    }

    public function services(): JsonResponse
    {
        $payload = PortfolioCache::remember('services', function () {
            $profile = $this->defaultProfile();

            return ServiceResource::collection(
                $profile->services()->where('is_active', true)->orderBy('display_order')->get()
            )->resolve();
        });

        return $this->ok($payload);
    }

    public function testimonials(): JsonResponse
    {
        $payload = PortfolioCache::remember('testimonials', function () {
            $profile = $this->defaultProfile();

            return TestimonialResource::collection(
                $profile->testimonials()->where('is_active', true)->orderBy('display_order')->get()
            )->resolve();
        });

        return $this->ok($payload);
    }

    public function settings(Request $request): JsonResponse
    {
        $payload = PortfolioCache::remember('settings', function () {
            return collect(\App\Models\Setting::where('is_public', true)->get())
                ->pluck('value', 'key')
                ->all();
        });

        return $this->ok($payload);
    }

    protected function paginationMeta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }
}