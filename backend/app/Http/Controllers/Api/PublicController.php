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
        return cache()->remember('portfolio.profile', 3600, function () {
            return Profile::query()
                ->with(['skills', 'experiences', 'educations', 'certifications'])
                ->firstOrFail();
        });
    }

    /** Homepage aggregate payload. */
    public function index(Request $request): JsonResponse
    {
        $profile = $this->defaultProfile();

        return $this->ok([
            'profile' => new ProfileResource($profile),
            'featured_projects' => ProjectResource::collection(
                $profile->projects()->with('skills')->where('featured', true)->where('is_active', true)->get()
            ),
            'recent_posts' => PostResource::collection(
                Post::published()->with('tags')->latest('published_at')->limit(3)->get()
            ),
            'testimonials' => TestimonialResource::collection(
                $profile->testimonials()->where('is_active', true)->get()
            ),
            'services' => ServiceResource::collection(
                $profile->services()->where('is_active', true)->get()
            ),
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
        $profile = $this->defaultProfile();

        return $this->ok([
            'skills' => SkillResource::collection($profile->skills()->where('is_active', true)->get()),
            'experiences' => ExperienceResource::collection($profile->experiences()->where('is_active', true)->get()),
            'educations' => EducationResource::collection($profile->educations()->where('is_active', true)->get()),
            'certifications' => CertificationResource::collection($profile->certifications()->where('is_active', true)->get()),
        ]);
    }

    public function projects(Request $request): JsonResponse
    {
        $query = Project::query()->with('skills')->where('is_active', true);

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        $projects = $query->orderBy('display_order')->orderByDesc('created_at')->paginate(12);

        return $this->ok(
            ProjectResource::collection($projects),
            'OK',
            ['pagination' => $this->paginationMeta($projects)]
        );
    }

    public function project(string $slug): JsonResponse
    {
        $project = Project::query()->with('skills')->where('is_active', true)->where('slug', $slug)->firstOrFail();

        return $this->ok(new ProjectResource($project));
    }

    public function posts(Request $request): JsonResponse
    {
        $query = Post::published()->with('tags');

        if ($request->filled('tag')) {
            $query->whereHas('tags', fn ($q) => $q->where('slug', $request->query('tag')));
        }

        $posts = $query->latest('published_at')->paginate(10);

        return $this->ok(
            PostResource::collection($posts),
            'OK',
            ['pagination' => $this->paginationMeta($posts)]
        );
    }

    public function post(string $slug): JsonResponse
    {
        $post = Post::published()->with('tags')->where('slug', $slug)->firstOrFail();

        return $this->ok(new PostResource($post));
    }

    public function publications(): JsonResponse
    {
        $profile = $this->defaultProfile();

        return $this->ok(PublicationResource::collection(
            $profile->publications()->where('is_active', true)->orderBy('display_order')->get()
        ));
    }

    public function services(): JsonResponse
    {
        $profile = $this->defaultProfile();

        return $this->ok(ServiceResource::collection(
            $profile->services()->where('is_active', true)->orderBy('display_order')->get()
        ));
    }

    public function testimonials(): JsonResponse
    {
        $profile = $this->defaultProfile();

        return $this->ok(TestimonialResource::collection(
            $profile->testimonials()->where('is_active', true)->orderBy('display_order')->get()
        ));
    }

    public function settings(Request $request): JsonResponse
    {
        return $this->ok(collect(\App\Models\Setting::where('is_public', true)->get())
            ->pluck('value', 'key')
            ->all());
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