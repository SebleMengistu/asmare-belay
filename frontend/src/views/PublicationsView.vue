<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Research & Publications',
  description: 'Journal articles, conference papers and applied research by Asmare Belay.',
})

const loading = ref(true)
const error = ref('')
const publications = ref([])

const grouped = computed(() => {
  const groups = new Map()
  for (const pub of publications.value) {
    const year = pub.year || 'Unpublished'
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push(pub)
  }
  return [...groups.entries()].sort((a, b) => String(b[0]).localeCompare(String(a[0])))
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
        <p class="eyebrow !text-accent-400">Research</p>
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Research &amp; Publications</h1>
        <p class="mt-2 text-sm text-slate-300">Journal articles, conference papers and applied research.</p>
      </div>
    </header>

    <div v-if="loading" class="space-y-5">
      <div v-for="n in 4" :key="n" class="card space-y-3">
        <div class="skeleton h-4 w-20" />
        <div class="skeleton h-5 w-3/4" />
        <div class="skeleton h-4 w-1/2" />
      </div>
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <p
      v-else-if="!publications.length"
      class="rounded-2xl border-2 border-dashed border-slate-300/80 p-12 text-center text-sm text-slate-500"
    >
      No publications published yet — check back soon.
    </p>

    <div v-else class="space-y-10">
      <section v-for="[year, items] in grouped" :key="year">
        <h2 class="font-display text-lg font-extrabold text-navy-900 dark:text-white">{{ year }}</h2>
        <ol class="mt-4 space-y-4">
          <li v-for="pub in items" :key="pub.id" class="card card-hover">
            <div class="flex flex-wrap items-center gap-2">
              <span class="chip !border-brand-100 !bg-brand-50/80 !text-brand-700 dark:!border-brand-500/30 dark:!bg-brand-600/15 dark:!text-brand-300">
                {{ pub.type || 'Publication' }}
              </span>
              <span v-if="pub.doi" class="text-xs text-slate-400">DOI: {{ pub.doi }}</span>
            </div>
            <h3 class="mt-2 font-display text-base font-bold text-navy-900 dark:text-white">{{ pub.title }}</h3>
            <p v-if="pub.authors" class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ pub.authors }}</p>
            <p class="mt-1 text-sm font-medium text-slate-400">{{ pub.venue }}</p>
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
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>
