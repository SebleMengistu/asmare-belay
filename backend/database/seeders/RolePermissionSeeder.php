<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Full permission catalogue for the portfolio CMS.
     *
     * @var list<string>
     */
    public const PERMISSIONS = [
        'manage profile',
        'manage projects',
        'manage posts',
        'manage skills',
        'manage experiences',
        'manage educations',
        'manage certifications',
        'manage publications',
        'manage services',
        'manage testimonials',
        'manage messages',
        'manage feedback',
        'manage settings',
    ];

    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $admin = \Spatie\Permission\Models\Role::findOrCreate('admin', 'web');
        $admin->syncPermissions(self::PERMISSIONS);

        $editor = \Spatie\Permission\Models\Role::findOrCreate('editor', 'web');
        $editor->syncPermissions([
            'manage profile',
            'manage projects',
            'manage posts',
            'manage skills',
            'manage testimonials',
        ]);

        // Create the primary administrator if none exists yet.
        $email = config('portfolio.admin_email', 'admin@tefera.dev');

        if (! User::where('email', $email)->exists()) {
            User::create([
                'name' => config('portfolio.admin_name', 'TEFERA Admin'),
                'email' => $email,
                'password' => \Illuminate\Support\Facades\Hash::make(
                    config('portfolio.admin_password', 'change-me-now')
                ),
            ])->assignRole('admin');
        }
    }
}