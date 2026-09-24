<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'CV',
  description: 'View and download the professional CV of Asmare Belay — Hydrology & Water Resources Engineer.',
})

const loading = ref(true)
const error = ref('')
const cv = ref(null)
const profile = ref(null)
const downloading = ref(false)

const cvUrl = computed(() => cv.value?.url || profile.value?.resume || '')

const summary = computed(() => {
  const meta = profile.value?.meta || {}
  return [
    { label: 'Current position', value: meta.current_position },
    { label: 'Organization', value: meta.current_organization },
    { label: 'Location', value: profile.value?.location },
  ].filter((row) => row.value)
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [cvRes, profileRes] = await Promise.all([
      http.get('/cv').catch(() => ({ data: { available: false } })),
      http.get('/profile').catch(() => ({ data: null })),
    ])
    cv.value = cvRes.data
    profile.value = profileRes.data
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function download() {
  if (!cvUrl.value) return
  downloading.value = true
  // Track the download (fire-and-forget; must never block the UX).
  http.post('/cv/download').catch(() => {})
  window.open(cvUrl.value, '_blank', 'noopener')
  setTimeout(() => (downloading.value = false), 800)
}

onMounted(load)
</script>

<template>
  <div class="space-y-8">
    <header
      class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-950 px-6 py-10 shadow-xl shadow-navy-950/30 sm:px-10"
    >
      <div class="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
      <div class="relative">
        <p class="eyebrow !text-accent-400">Curriculum Vitae</p>
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Professional CV</h1>
        <p class="mt-2 text-sm text-slate-300">
          {{ profile?.display_name || 'Asmare Belay Ngussie' }} — {{ profile?.headline || 'Hydrology & Water Resources Engineer' }}
        </p>
      </div>
    </header>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <div v-if="loading" class="card space-y-4 p-8">
      <div class="skeleton h-6 w-56" />
      <div class="skeleton h-4 w-full" />
      <div class="skeleton h-4 w-2/3" />
    </div>

    <div v-else class="grid gap-8 lg:grid-cols-12">
      <!-- CV card -->
      <div class="lg:col-span-8">
        <div class="card p-8 text-center">
          <span
            class="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-xl shadow-brand-600/25"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" class="h-10 w-10 fill-current">
              <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5L14 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
            </svg>
          </span>

          <h2 class="mt-5 font-display text-lg font-bold text-navy-900 dark:text-white">
            {{ cv?.file_name || 'Asmare-Belay-CV.pdf' }}
          </h2>
          <p v-if="cv?.updated_at" class="mt-1 text-xs text-slate-400">
            Last updated {{ new Date(cv.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) }}
          </p>

          <p v-if="!cvUrl" class="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-white/10">
            The CV file hasn't been uploaded yet. Once uploaded via the admin panel it will be available here.
          </p>

          <div class="mt-6 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              class="btn-primary"
              :disabled="!cvUrl || downloading"
              @click="download"
            >
              {{ downloading ? 'Opening…' : 'Download CV ⬇' }}
            </button>
            <a
              v-if="cvUrl"
              :href="cvUrl"
              target="_blank"
              rel="noopener"
              class="btn-outline"
            >
              View CV ↗
            </a>
          </div>
        </div>

        <p class="mt-6 text-center text-xs text-slate-400">
          The CV is a PDF document summarizing experience, education, skills, publications and certifications from this site.
        </p>
      </div>

      <!-- Summary panel -->
      <aside class="lg:col-span-4">
        <div class="panel-navy flex flex-col gap-1 p-6">
          <p class="mb-2 font-display text-sm font-bold uppercase tracking-wider text-white">At a Glance</p>
          <div
            v-for="row in summary"
            :key="row.label"
            class="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/5"
          >
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300">
              <svg viewBox="0 0 24 24" class="h-4.5 w-4.5 fill-current" aria-hidden="true">
                <path d="M10 2h4a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2zm0 4h4V4h-4v2z" />
              </svg>
            </span>
            <span class="min-w-0">
              <span class="block text-xs text-slate-400">{{ row.label }}</span>
              <span class="block text-sm font-semibold text-white">{{ row.value }}</span>
            </span>
          </div>

          <RouterLink to="/contact" class="btn-primary mt-4 w-full">Contact Me</RouterLink>
        </div>
      </aside>
    </div>
  </div>
</template>
