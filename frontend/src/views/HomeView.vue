<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'
import HeroSection from '../components/home/HeroSection.vue'
import StatsBar from '../components/home/StatsBar.vue'
import AboutSection from '../components/home/AboutSection.vue'
import FeaturedProjects from '../components/home/FeaturedProjects.vue'
import InsightsSection from '../components/home/InsightsSection.vue'
import BlogSection from '../components/home/BlogSection.vue'
import CtaBanner from '../components/home/CtaBanner.vue'

const loading = ref(true)
const error = ref('')
const profile = ref(null)
const featured = ref([])
const posts = ref([])
const publications = ref([])
const skills = ref([])
const experiences = ref([])
const educations = ref([])
const certifications = ref([])

// Counter values for the stats bar — API meta overrides the mockup defaults.
const stats = computed(() => {
  const meta = profile.value?.meta || {}
  const num = (value, fallback) => {
    const n = Number(value)
    return Number.isFinite(n) && String(value ?? '').trim() !== '' && n >= 0 ? Math.round(n) : fallback
  }

  return [
    { target: num(meta.experience_years, 10), value: 0, suffix: '+', label: 'Years Experience', icon: 'experience' },
    { target: num(meta.projects_completed, 40), value: 0, suffix: '+', label: 'Projects Completed', icon: 'projects' },
    { target: num(meta.research_publications, 15), value: 0, suffix: '+', label: 'Research Publications', icon: 'publications' },
    { target: num(meta.technologies, 20), value: 0, suffix: '+', label: 'Technologies', icon: 'technologies' },
    { target: num(meta.students_trained, 500), value: 0, suffix: '+', label: 'Students Trained', icon: 'students' },
  ]
})

const socials = () =>
  Object.entries({
    Website: profile.value?.website,
    GitHub: profile.value?.github,
    LinkedIn: profile.value?.linkedin,
    Twitter: profile.value?.twitter,
  }).filter(([, url]) => Boolean(url))

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [home, pubs, skillData] = await Promise.all([
      http.get('/'),
      // Publications are decorative on the homepage — never block the page.
      http.get('/publications').catch(() => ({ data: [] })),
      // Skills + experiences (bundled in one endpoint).
      http.get('/skills').catch(() => ({ data: {} })),
    ])

    profile.value = home.data.profile ?? null
    featured.value = home.data.featured_projects ?? []
    posts.value = home.data.recent_posts ?? []
    publications.value = pubs.data ?? []
    skills.value = skillData.data.skills ?? []
    experiences.value = skillData.data.experiences ?? []
    educations.value = skillData.data.educations ?? []
    certifications.value = skillData.data.certifications ?? []

    const p = profile.value || {}
    const summary = String(p.tagline || p.bio || '').trim()
    useSeo({
      raw: true,
      title: p.display_name
        ? (p.headline ? `${p.display_name} — ${p.headline}` : p.display_name)
        : 'Asmare Belay — Hydrology & Water Resources Engineer, Lecturer & Researcher',
      description: summary.slice(0, 158) || 'Hydrology & Water Resources Engineer, Lecturer & Researcher.',
      image: p.avatar,
      type: 'profile',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: p.display_name || 'Asmare Belay',
        jobTitle: p.headline || undefined,
        description: summary || undefined,
        image: p.avatar || undefined,
        sameAs: socials().map(([, url]) => url),
      },
    })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div v-if="error" class="container-site pt-6">
      <p
        class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700
          dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
      >
        Couldn't load live content ({{ error }}) — showing default content instead.
      </p>
    </div>

    <HeroSection :profile="profile" />
    <StatsBar :stats="stats" />
    <AboutSection :profile="profile" :educations="educations" :certifications="certifications" :loading="loading" />
    <FeaturedProjects :projects="featured" :loading="loading" />
    <!-- Invisible anchor so /#teaching scrolls to the right place -->
    <span id="teaching" class="block" style="margin-top: -80px; padding-top: 80px;" aria-hidden="true" />
    <InsightsSection :publications="publications" :skills="skills" :experiences="experiences" :loading="loading" />
    <BlogSection :posts="posts" :loading="loading" />
    <CtaBanner />
  </div>
</template>

