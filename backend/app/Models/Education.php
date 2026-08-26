<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Education extends Model
{
    use HasFactory;

    /**
     * Doctrine's inflector does not pluralise "Education", so it must be
     * declared explicitly to match the `educations` table.
     */
    protected $table = 'educations';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'profile_id', 'degree', 'field_of_study', 'institution', 'location',
        'start_date', 'end_date', 'grade', 'description', 'display_order', 'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}