<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

const loading = ref(true)
const error = ref('')
const profile = ref(null)
const featured = ref([])
const posts = ref([])
const testimonials = ref([])
const services = ref([])

const stackOf = (value) =>
  Array.isArray(value)
    ? value.filter(Boolean)
    : String(value || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''

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
    const res = await http.get('/')
    profile.value = res.data.profile ?? null
    featured.value = res.data.featured_projects ?? []
    posts.value = res.data.recent_posts ?? []
    testimonials.value = res.data.testimonials ?? []
    services.value = res.data.services ?? []

    const p = profile.value
    const summary = String(p.tagline || p.bio || '').trim()
    useSeo({
      raw: true,
      title: p.headline ? `${p.display_name} — ${p.headline}` : p.display_name,
      description: summary.slice(0, 158),
      image: p.avatar,
      type: 'profile',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: p.display_name,
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
  <div class="space-y-12">
    <p v-if="loading" class="text-sm text-slate-500">Loading portfolio…</p>

    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <template v-else-if="profile">
            <!-- Hero -->
      <section class="flex flex-col gap-6 sm:flex-row sm:items-start">
        <img
          v-if="profile.avatar"
          :src="profile.avatar"
          alt=""
          class="h-28 w-28 rounded-full border border-slate-200 object-cover"
        />
        <div class="space-y-3">
          <span
            v-if="profile.available_for_work"
            class="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-700"
          >
            Available for work
          </span>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900">{{ profile.display_name }}</h1>
          <p v-if="profile.headline" class="text-lg text-indigo-700">{{ profile.headline }}</p>
          <p v-if="profile.tagline" class="italic text-slate-500">{{ profile.tagline }}</p>
          <p v-if="profile.bio" class="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {{ profile.bio }}
          </p>
          <div class="flex flex-wrap items-center gap-3 pt-1">
            <a
              v-for="[label, url] in socials()"
              :key="label"
              :href="url"
              target="_blank"
              rel="noopener"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              {{ label }} ↗
            </a>
            <a
              v-if="profile.resume"
              :href="profile.resume"
              class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Download Résumé
            </a>
            <RouterLink
              to="/contact"
              class="rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Get in touch
            </RouterLink>
          </div>
          <p v-if="profile.location" class="pt-1 text-xs uppercase tracking-wide text-slate-400">
            📍 {{ profile.location }}
          </p>
        </div>
      </section>

      <!-- Featured projects -->
      <section v-if="featured.length" class="space-y-4">
        <div class="flex items-baseline justify-between">
          <h2 class="text-xl font-bold text-slate-900">Featured Projects</h2>
          <RouterLink to="/projects" class="text-sm font-medium">All projects →</RouterLink>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="project in featured"
            :key="project.id"
            class="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 class="font-semibold text-slate-900">{{ project.title }}</h3>
            <p v-if="project.summary" class="mt-1 line-clamp-3 text-sm text-slate-600">{{ project.summary }}</p>
            <div class="mt-3 flex flex-wrap gap-1.5">
              <span
                v-for="tech in stackOf(project.tech_stack).slice(0, 6)"
                :key="tech"
                class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {{ tech }}
              </span>
            </div>
            <div class="mt-auto flex gap-3 pt-4 text-sm font-medium">
              <RouterLink :to="{ name: 'project', params: { slug: project.slug } }" class="text-indigo-600">
                Details
              </RouterLink>
              <a v-if="project.demo_url" :href="project.demo_url" target="_blank" rel="noopener">Demo ↗</a>
              <a v-if="project.repo_url" :href="project.repo_url" target="_blank" rel="noopener">Code ↗</a>
            </div>
          </article>
        </div>
      </section>
            <!-- Services -->
      <section v-if="services.length" class="space-y-4">
        <div class="flex items-baseline justify-between">
          <h2 class="text-xl font-bold text-slate-900">Services</h2>
          <RouterLink to="/services" class="text-sm font-medium">More →</RouterLink>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="service in services.slice(0, 6)"
            :key="service.id"
            class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 class="font-semibold text-slate-900">{{ service.title }}</h3>
            <p class="mt-1 line-clamp-2 text-sm text-slate-600">{{ service.summary }}</p>
          </article>
        </div>
      </section>

      <!-- Recent posts -->
      <section v-if="posts.length" class="space-y-4">
        <div class="flex items-baseline justify-between">
          <h2 class="text-xl font-bold text-slate-900">Recent Writing</h2>
          <RouterLink to="/posts" class="text-sm font-medium">Blog →</RouterLink>
        </div>
        <ul class="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <li v-for="post in posts" :key="post.id">
            <RouterLink :to="{ name: 'post', params: { slug: post.slug } }" class="block p-4 hover:bg-slate-50">
              <span class="font-semibold text-slate-900">{{ post.title }}</span>
              <span class="ml-2 text-xs text-slate-400">{{ fmtDate(post.published_at) }}</span>
              <p v-if="post.excerpt" class="mt-1 line-clamp-2 text-sm text-slate-600">{{ post.excerpt }}</p>
            </RouterLink>
          </li>
        </ul>
      </section>

      <!-- Testimonials -->
      <section v-if="testimonials.length" class="space-y-4">
        <h2 class="text-xl font-bold text-slate-900">Testimonials</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <figure
            v-for="t in testimonials"
            :key="t.id"
            class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <blockquote class="text-sm italic leading-relaxed text-slate-700">“{{ t.quote }}”</blockquote>
            <figcaption class="mt-3 text-sm font-medium text-slate-900">
              {{ t.name }}
              <span v-if="t.role || t.company" class="font-normal text-slate-500">
                · {{ [t.role, t.company].filter(Boolean).join(', ') }}
              </span>
              <span class="ml-1 text-amber-500">
                {{ '★'.repeat(Math.max(1, Math.min(5, Number(t.rating) || 5))) }}
              </span>
            </figcaption>
          </figure>
        </div>
      </section>
    </template>
  </div>
</template>
