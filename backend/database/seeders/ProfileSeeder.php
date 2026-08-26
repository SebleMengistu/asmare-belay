<?php

namespace Database\Seeders;

use App\Models\Education;
use App\Models\Experience;
use App\Models\Post;
use App\Models\Profile;
use App\Models\Project;
use App\Models\Publication;
use App\Models\Skill;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProfileSeeder extends Seeder
{
    public function run(): void
    {
        if (Profile::exists()) {
            return;
        }

        $user = User::role('admin')->first() ?? User::firstOrCreate(
            ['email' => config('portfolio.admin_email', 'admin@tefera.dev')],
            ['name' => config('portfolio.admin_name', 'TEFERA Admin'), 'password' => 'change-me-now']
        );

        $profile = Profile::create([
            'user_id' => $user->id,
            'first_name' => 'Tefera',
            'last_name' => 'Worku',
            'display_name' => 'Tefera Worku',
            'headline' => 'IT Lecturer · Software Developer · Odoo Developer / Consultant · Researcher',
            'tagline' => 'Turning complex problems into clean, maintainable software and systems.',
            'bio' => 'A passionate educator and full-stack developer focused on web applications, Odoo ecosystems, and applied research. I build with Laravel, Vue, and PostgreSQL, and I enjoy mentoring the next generation of engineers.',
            'location' => 'Ethiopia',
            'website' => 'https://tefera.example.com',
            'email_public' => 'hello@tefera.dev',
            'github' => 'https://github.com/tefera',
            'linkedin' => 'https://linkedin.com/in/tefera',
            'twitter' => 'https://twitter.com/tefera',
            'roles' => ['IT Lecturer', 'Software Developer', 'Odoo Developer/Consultant', 'Researcher'],
            'available_for_work' => true,
            'meta' => ['experience_years' => 10],
        ]);

        $skills = [
            ['PHP', 'backend', 90], ['Laravel', 'backend', 92], ['PostgreSQL', 'database', 85],
            ['Vue.js', 'frontend', 80], ['JavaScript', 'frontend', 82], ['Tailwind CSS', 'frontend', 75],
            ['Odoo', 'odoo', 88], ['Python', 'python', 84], ['Docker', 'tools', 70],
            ['Git', 'tools', 90], ['REST API', 'backend', 88], ['Teaching', 'teaching', 95],
        ];

        foreach ($skills as [$name, $category, $level]) {
            Skill::create([
                'profile_id' => $profile->id,
                'name' => $name,
                'category' => $category,
                'level' => $level,
                'is_active' => true,
            ]);
        }

        Experience::create([
            'profile_id' => $profile->id,
            'title' => 'Senior Software Developer',
            'company' => 'Acme Solutions',
            'company_url' => 'https://example.com',
            'location' => 'Addis Ababa',
            'start_date' => '2020-01-01',
            'current' => true,
            'description' => 'Architect and build web solutions for clients across finance, education and logistics.',
            'highlights' => ['Delivered 20+ production Laravel/Vue apps', 'Led a 5-person engineering team'],
            'is_active' => true,
        ]);

        Experience::create([
            'profile_id' => $profile->id,
            'title' => 'IT Lecturer',
            'company' => 'State University',
            'location' => 'Ethiopia',
            'start_date' => '2015-09-01',
            'end_date' => '2020-08-31',
            'description' => 'Taught undergraduate courses in data structures, web programming and database systems.',
            'is_active' => true,
        ]);

        Education::create([
            'profile_id' => $profile->id,
            'degree' => "Master's in Computer Science",
            'field_of_study' => 'Software Engineering',
            'institution' => 'University of Technology',
            'start_date' => '2015-09-01',
            'end_date' => '2017-07-01',
            'grade' => 'Distinction',
            'is_active' => true,
        ]);

        $project = Project::create([
            'profile_id' => $profile->id,
            'title' => 'TEFERA Portfolio Platform',
            'summary' => 'A headless CMS + portfolio with a Vue SPA, built on Laravel, Sanctum and PostgreSQL.',
            'description' => 'A production-grade portfolio and CMS proving a full-stack architecture with a public API, admin dashboard and SEO meta-shell.',
            'category' => 'web',
            'repo_url' => 'https://github.com/tefera/tefera',
            'demo_url' => 'https://tefera.example.com',
            'tech_stack' => ['Laravel', 'Vue', 'PostgreSQL', 'Tailwind'],
            'featured' => true,
            'is_active' => true,
        ]);
        $project->skills()->attach(Skill::whereIn('name', ['Laravel', 'Vue.js', 'PostgreSQL', 'Tailwind CSS'])->pluck('id'));

        $post = Post::create([
            'profile_id' => $profile->id,
            'title' => 'Why Laravel + Vue remains my default stack',
            'body' => "Over the years I've shipped dozens of products. Laravel gives me a delightfully productive backend, Vue a reactive frontend, and PostgreSQL the reliability production data deserves.",
            'excerpt' => 'Reflections on a decade of full-stack development.',
            'status' => 'published',
            'published_at' => now()->subDays(5),
        ]);
        $post->tags()->createMany([['name' => 'Laravel'], ['name' => 'Vue']]);

        Publication::create([
            'profile_id' => $profile->id,
            'title' => 'A Comparative Study of Monolith and Microservice Architectures',
            'authors' => 'T. Worku',
            'venue' => 'International Journal of Software Engineering',
            'type' => 'journal',
            'year' => '2022',
            'doi' => '10.1000/xyz',
            'is_active' => true,
        ]);

        Testimonial::create([
            'profile_id' => $profile->id,
            'name' => 'Amina Yusuf',
            'role' => 'Product Manager',
            'company' => 'FinTech Co.',
            'quote' => 'Tefera delivered on time, communicated clearly, and produced code our team still loves to maintain.',
            'rating' => 5,
            'is_active' => true,
        ]);
    }
}