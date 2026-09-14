<?php

namespace Database\Seeders;

use App\Models\Certification;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Post;
use App\Models\Profile;
use App\Models\Project;
use App\Models\Publication;
use App\Models\Skill;
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
            ['name' => config('portfolio.admin_name', 'TEFERA Admin'), 'password' => config('portfolio.admin_password', 'change-me-now')]
        );

        $data = static::cvData();

        $profile = Profile::create(
            ['user_id' => $user->id] + $data['profile'],
        );

        foreach ($data['skills'] as $i => [$name, $category, $level]) {
            Skill::create([
                'profile_id' => $profile->id,
                'name' => $name,
                'category' => $category,
                'level' => $level,
                'display_order' => $i + 1,
                'is_active' => true,
            ]);
        }

        foreach ($data['experiences'] as $experience) {
            Experience::create($experience + [
                'profile_id' => $profile->id,
                'is_active' => true,
            ]);
        }

        foreach ($data['educations'] as $education) {
            Education::create($education + [
                'profile_id' => $profile->id,
                'is_active' => true,
            ]);
        }

        foreach ($data['certifications'] as [$name, $issuer]) {
            Certification::create([
                'profile_id' => $profile->id,
                'name' => $name,
                'issuer' => $issuer,
                'is_active' => true,
            ]);
        }

        $project = Project::create([
            'profile_id' => $profile->id,
            'title' => 'TEFERA Portfolio Platform',
            'summary' => 'A headless CMS + portfolio with a Vue SPA, built on Laravel, Sanctum and PostgreSQL.',
            'description' => 'A production-grade portfolio and CMS proving a full-stack architecture with a public API, admin dashboard and SEO meta-shell.',
            'category' => 'web',
            'repo_url' => 'https://github.com/Tefe-Ala',
            'demo_url' => null,
            'tech_stack' => ['Laravel', 'Vue', 'PostgreSQL', 'Tailwind'],
            'featured' => true,
            'is_active' => true,
        ]);
        $project->skills()->attach(Skill::whereIn('name', ['Laravel', 'Vue.js', 'PostgreSQL', 'Tailwind CSS'])->pluck('id'));

        $posts = [
            [
                'title' => 'Building Scalable Web Applications with Laravel & Vue.js',
                'excerpt' => 'Best practices for building scalable and maintainable web applications.',
                'body' => 'In this article I walk through the architecture, caching and deployment patterns I use to keep Laravel + Vue applications fast and maintainable as they grow.',
                'tags' => [['name' => 'Development'], ['name' => 'Laravel'], ['name' => 'Vue.js']],
                'published_at' => '2024-05-12 09:00:00',
            ],
            [
                'title' => '10 Tips for Successful Odoo Implementation',
                'excerpt' => 'Essential tips for a smooth and successful Odoo ERP implementation.',
                'body' => 'From requirement workshops to module customisation and user training — these are the lessons I have learned delivering Odoo for real businesses.',
                'tags' => [['name' => 'Odoo'], ['name' => 'ERP']],
                'published_at' => '2024-04-28 09:00:00',
            ],
            [
                'title' => 'The Future of AI in Education',
                'excerpt' => 'Exploring how AI is transforming the future of teaching and learning.',
                'body' => 'Artificial intelligence is reshaping classrooms. Here is my take on where intelligent tutoring, assessment automation and learning analytics are heading.',
                'tags' => [['name' => 'Machine Learning'], ['name' => 'Education']],
                'published_at' => '2024-04-10 09:00:00',
            ],
        ];

        foreach ($posts as $postData) {
            $post = Post::create([
                'profile_id' => $profile->id,
                'title' => $postData['title'],
                'body' => $postData['body'],
                'excerpt' => $postData['excerpt'],
                'status' => 'published',
                'published_at' => $postData['published_at'],
            ]);
            $post->tags()->createMany($postData['tags']);
        }

        foreach ($data['publications'] as $publication) {
            Publication::create($publication + ['profile_id' => $profile->id, 'is_active' => true]);
        }
    }

    /**
     * Real CV data (source: Cvs.pdf, verified 2026-09-03).
     *
     * Single source of truth shared by run() (fresh installs) and
     * tools/sync-cv-data.php (live database), so the two never drift.
     * Skill levels are self-assessed — the CV does not state them.
     */
    public static function cvData(): array
    {
        return [
            'profile' => [
                'first_name' => 'Tefera',
                'last_name' => 'Alagaw',
                'display_name' => 'Tefera Alagaw',
                'headline' => 'Educational Manager | IT Lecturer | Full-Stack Developer | AI & Cybersecurity Researcher',
                'tagline' => 'Bridging theoretical computer science with practical industry applications to produce job-ready graduates.',
                'bio' => "Dynamic and results-oriented Educational Manager and IT Lecturer with over 5 years of experience in higher education and software development. Proven track record of leading academic programs, designing industry-relevant curricula, and mentoring students in networking, security, and full-stack development.\n\nCombines deep technical expertise in Odoo, Vue.js, Laravel, Java, and Python with a strong research focus on AI and Cybersecurity. Passionate about bridging theoretical computer science with practical industry applications to produce job-ready graduates.",
                'location' => 'Kombolcha, Ethiopia',
                'website' => null,
                'email_public' => 'tefe7ala@gmail.com',
                'phone' => '+251-932-242432',
                'github' => 'https://github.com/Tefe-Ala',
                'linkedin' => 'https://linkedin.com/in/tefera-alagaw-a95073230',
                'twitter' => null,
                'whatsapp' => null,
                'roles' => ['Educational Manager', 'IT Lecturer', 'Full-Stack Developer', 'AI & Cybersecurity Researcher'],
                'available_for_work' => true,
                'meta' => [
                    'experience_years' => 7,
                    'projects_completed' => 20,
                    'research_publications' => 1,
                    'technologies' => 24,
                    'students_trained' => 500,
                ],
            ],

            'skills' => [
                ['PHP', 'backend', 85],
                ['Laravel', 'backend', 88],
                ['Vue.js', 'frontend', 85],
                ['JavaScript', 'frontend', 82],
                ['Tailwind CSS', 'frontend', 78],
                ['Java', 'backend', 80],
                ['Python', 'backend', 82],
                ['Spring Boot', 'backend', 72],
                ['Django', 'backend', 70],
                ['REST API', 'backend', 85],
                ['Odoo', 'odoo', 88],
                ['MySQL', 'database', 82],
                ['PostgreSQL', 'database', 85],
                ['MongoDB', 'database', 75],
                ['Network Security & Administration', 'security', 88],
                ['Cryptography', 'security', 85],
                ['Cisco Networking (TCP/IP, Routing & Switching)', 'networking', 82],
                ['Git', 'tools', 88],
                ['Docker', 'tools', 70],
                ['Postman', 'tools', 78],
                ['Linux', 'tools', 75],
                ['Moodle', 'lms', 80],
                ['Blackboard', 'lms', 75],
                ['Teaching & Mentoring', 'teaching', 95],
            ],

            'experiences' => [
                [
                    'title' => 'IT Lecturer',
                    'company' => 'Wollo University (KIoT)',
                    'company_url' => null,
                    'location' => 'Kombolcha, Ethiopia',
                    'start_date' => '2023-08-01',
                    'end_date' => null,
                    'current' => true,
                    'description' => 'Deliver engaging lectures and practical workshops for 150+ undergraduate students per semester in Data Communication & Networking, Network Administration, Computer Security, Backend & Frontend Programming, and Database Management.',
                    'highlights' => [
                        'IT Department Focal Person — coordinating academic activities, faculty schedules and student affairs',
                        'Member of the Department Council (DC), contributing to strategic decision-making and policy development',
                        'Serve on the Exam Review, Screening, Curriculum Review, Exit Exam and Course Offering committees',
                        'Supervise BSc final-year projects and chair MSc thesis defenses',
                        'Participate in university research calls — currently investigating AI applications in cybersecurity and cryptography',
                    ],
                    'display_order' => 1,
                ],
                [
                    'title' => 'Full-Stack Developer (Freelance & Projects)',
                    'company' => 'Self-Employed',
                    'company_url' => null,
                    'location' => null,
                    'start_date' => '2021-11-01',
                    'end_date' => '2023-07-31',
                    'current' => false,
                    'description' => 'Delivered Odoo ERP and full-stack web solutions for small and medium enterprises as an independent developer.',
                    'highlights' => [
                        'Developed custom Odoo ERP solutions for SMEs, optimizing business workflows',
                        'Built responsive web applications using Vue.js (frontend) and Laravel (backend)',
                        'Designed and deployed secure RESTful APIs for data integration',
                        'Applied cybersecurity best practices: secure authentication, encryption and data validation',
                        'Managed version control with Git and collaborated with clients to deliver scalable solutions',
                    ],
                    'display_order' => 2,
                ],
                [
                    'title' => 'Assistant Lecturer',
                    'company' => 'Wollo University (KIoT)',
                    'company_url' => null,
                    'location' => 'Kombolcha, Ethiopia',
                    'start_date' => '2019-08-01',
                    'end_date' => '2021-10-31',
                    'current' => false,
                    'description' => 'Delivered foundational and intermediate IT courses to undergraduate students and supported academic administration.',
                    'highlights' => [
                        'Developed course materials, lab manuals and assessment tools for networking and programming modules',
                        'Mentored students in academic and career development',
                        'Served on various departmental committees, gaining early leadership experience',
                        'Contributed to the continuous improvement of the IT curriculum',
                    ],
                    'display_order' => 3,
                ],
            ],

            'educations' => [
                [
                    'degree' => 'Master of Science (MSc)',
                    'field_of_study' => 'Computer Network and Security',
                    'institution' => 'Debre Berhan University',
                    'location' => 'Ethiopia',
                    'start_date' => '2023-09-01',
                    'end_date' => '2025-07-01',
                    'grade' => 'CGPA 3.75/4.0 · Thesis Result: Very Good',
                    'description' => 'Thesis: Security Enhancement of Playfair Cipher Using Modified BBS Algorithm and Keystream Values',
                    'display_order' => 1,
                ],
                [
                    'degree' => 'Bachelor of Science (BSc)',
                    'field_of_study' => 'Information Technology',
                    'institution' => 'Wollo University, Kombolcha Institute of Technology',
                    'location' => 'Kombolcha, Ethiopia',
                    'start_date' => '2015-09-01',
                    'end_date' => '2019-07-01',
                    'grade' => 'CGPA 3.89/4.0 (Distinction)',
                    'description' => 'Graduated with Great Distinction, Gold Medal and Academic Cup; ranked 1st in the college/semester',
                    'display_order' => 2,
                ],
            ],

            'certifications' => [
                ['Cisco Cybersecurity Certification', 'Cisco'],
                ['Cisco IoT Certification', 'Cisco'],
                ['Data Carpentry Workshop Certificate', 'Data Carpentry'],
                ['Certification of Appreciation – Best Academic Achievement', 'Wollo University (KIoT)'],
                ['Semester 1st Ranked Achievement Certificate', 'Wollo University (KIoT)'],
                ['Great Distinction, Gold Medal & Academic Cup', 'Wollo University (KIoT)'],
                ['Exit Exam Committee Letter of Appointment', 'Wollo University (KIoT)'],
                ['Exam Review Committee Letter of Appointment', 'Wollo University (KIoT)'],
                ['Department Focal Person Letter of Appointment', 'Wollo University (KIoT)'],
                ['Course Offering Committee Letter of Appointment', 'Wollo University (KIoT)'],
            ],

            'publications' => [
                [
                    'title' => 'Security Enhancement of Playfair Cipher Using Modified BBS Algorithm and Keystream Values',
                    'authors' => 'Tefera Alagaw',
                    'venue' => 'Debre Berhan University, Ethiopia',
                    'type' => 'thesis',
                    'year' => '2025',
                    'abstract' => 'A novel hybrid cryptographic approach combining the Playfair cipher with a modified Blum-Blum-Shub (BBS) generator for enhanced keystream security. Implemented and evaluated using performance metrics, demonstrating improved resistance to cryptanalysis compared to traditional Playfair implementations.',
                    'display_order' => 1,
                ],
            ],
        ];
    }
}