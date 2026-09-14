<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Schema;

/**
 * Reusable read/destroy scaffolding for admin CRUD controllers. Concrete
 * controllers implement store()/update() and provide the model + resource.
 */
abstract class BaseCrudController extends Controller
{
    use ApiResponse;

    abstract protected function model(): string;

    /**
     * Id of the portfolio profile that owns profile-scoped records.
     * Admin-created rows are attached to it so the public site (which reads
     * via Profile::hasMany) picks them up.
     */
    protected function defaultProfileId(): ?int
    {
        return \App\Models\Profile::query()->orderBy('id')->value('id');
    }

    /** Merge the default profile_id into a create payload if the model has the column. */
    protected function withProfileId(string $model, array $data): array
    {
        if (Schema::hasColumn((new $model)->getTable(), 'profile_id') && !isset($data['profile_id'])) {
            $data['profile_id'] = $this->defaultProfileId();
        }

        return $data;
    }

    /**
     * Normalise a URL input so "www.example.com" passes Laravel's url rule.
     * Empty/null values are preserved.
     */
    protected function normalizeUrl(?string $value): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        if (!preg_match('#^[a-z][a-z0-9+\-.]*://#i', $value)) {
            $value = 'https://'.$value;
        }

        return $value;
    }

    abstract protected function resource(): string;

    public function index(Request $request): JsonResponse
    {
        $model = ($this->model())::query();

        if ($request->filled('search')) {
            $term = '%'.trim($request->query('search')).'%';
            $columns = array_filter(
                ['title', 'name'],
                fn ($column) => Schema::hasColumn($model->getModel()->getTable(), $column),
            );

            if ($columns !== []) {
                $model->where(function ($query) use ($columns, $term) {
                    foreach ($columns as $column) {
                        $query->orWhere($column, 'like', $term);
                    }
                });
            }
        }

        $rows = $model->orderByDesc('created_at')->get();

        return $this->ok($this->resourceCollection($rows));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $row = ($this->model())::with($this->relations())->findOrFail($id);

        return $this->ok(new ($this->resource())($row));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ($this->model())::findOrFail($id)->delete();

        return $this->noContent('Deleted');
    }

    protected function relations(): array
    {
        return [];
    }

    protected function resourceCollection($rows): mixed
    {
        $resource = $this->resource();

        return $resource::collection($rows);
    }
}