<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Publications',
  description: 'Publications, theses and research outputs by Asmare Belay — hydrological modeling and water resources engineering.',
})

const loading = ref(true)
const error = ref('')
const publications = ref([])
const search = ref('')
const activeYear = ref('')
const activeType = ref('')

const TYPES = {
  journal: 'Journal Article',
  conference: 'Conference Paper',
  thesis: 'Thesis',
  report: 'Report',
  book: 'Book Chapter',
}

const years = computed(() => [
  ...new Set(publications.value.map((p) => p.year).filter(Boolean)),
].sort((a, b) => String(b).localeCompare(String(a))))

const types = computed(() => [
  ...new Set(publications.value.map((p) => p.type).filter(Boolean)),
])

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return publications.value
    .filter((p) => (activeYear.value ? p.year === activeYear.value : true))
    .filter((p) => (activeType.value ? p.type === activeType.value : true))
    .filter((p) => {
      if (!term) return true
      return [p.title, p.authors, p.venue, p.abstract]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    })
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/publications')
    publications.value = res.data ?? []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
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
        <p class="eyebrow !text-accent-400">Research Output</p>
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Publications</h1>
        <p class="mt-2 text-sm text-slate-300">Journal articles, theses and applied research.</p>
      </div>
    </header>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <!-- Search + filters -->
    <div v-if="publications.length" class="flex flex-wrap items-center gap-3">
      <label class="relative min-w-[220px] flex-1">
        <span class="sr-only">Search publications</span>
        <svg viewBox="0 0 24 24" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-current stroke-2 text-slate-400" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="search"
          type="search"
          placeholder="Search titles, authors, venues…"
          class="input !pl-9"
        />
      </label>
      <select v-model="activeYear" class="input !w-auto" aria-label="Filter by year">
        <option value="">All years</option>
        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
      </select>
      <select v-model="activeType" class="input !w-auto" aria-label="Filter by type">
        <option value="">All types</option>
        <option v-for="type in types" :key="type" :value="type">{{ TYPES[type] || type }}</option>
      </select>
    </div>

    <div v-if="loading" class="space-y-5">
      <div v-for="n in 4" :key="n" class="card space-y-3 p-6">
        <div class="skeleton h-4 w-20" />
        <div class="skeleton h-5 w-3/4" />
        <div class="skeleton h-4 w-1/2" />
      </div>
    </div>

    <p
      v-else-if="!publications.length"
      class="rounded-2xl border-2 border-dashed border-slate-300/80 p-12 text-center text-sm text-slate-500"
    >
      No publications published yet — check back soon.
    </p>

    <p
      v-else-if="!filtered.length"
      class="rounded-2xl border-2 border-dashed border-slate-300/80 p-12 text-center text-sm text-slate-500"
    >
      No publications match your search.
    </p>

    <div v-else class="space-y-4">
      <article v-for="pub in filtered" :key="pub.id" class="card card-hover p-6">
        <div class="flex flex-wrap items-center gap-2">
          <span class="chip !border-brand-100 !bg-brand-50/80 !text-brand-700 dark:!border-brand-500/30 dark:!bg-brand-600/15 dark:!text-brand-300">
            {{ TYPES[pub.type] || pub.type || 'Publication' }}
          </span>
          <span v-if="pub.year" class="text-xs font-bold text-slate-400">{{ pub.year }}</span>
          <span v-if="pub.doi" class="text-xs text-slate-400">DOI: {{ pub.doi }}</span>
        </div>
        <h2 class="mt-2 font-display text-base font-bold text-navy-900 dark:text-white">{{ pub.title }}</h2>
        <p v-if="pub.authors" class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ pub.authors }}</p>
        <p v-if="pub.venue" class="mt-1 text-sm font-medium text-slate-400">{{ pub.venue }}</p>
        <div v-if="pub.abstract" class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {{ pub.abstract }}
        </div>
        <a
          v-if="pub.url"
          :href="pub.url"
          target="_blank"
          rel="noopener"
          class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-400"
        >
          Read paper ↗
        </a>
      </article>
    </div>
  </div>
</template>
