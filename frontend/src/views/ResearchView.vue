<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Research',
  description:
    'Research themes of Asmare Belay — hydrological modeling, climate change and water resources, flood forecasting, groundwater, remote sensing and integrated hydrologic modeling.',
})

const loading = ref(true)
const error = ref('')
const themes = ref([])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/research')
    themes.value = res.data ?? []
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
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Research Themes</h1>
        <p class="mt-2 text-sm text-slate-300">
          {{ loading ? 'Loading research themes…' : `${themes.length} active areas of investigation.` }}
        </p>
      </div>
    </header>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <div v-if="loading" class="grid gap-5 md:grid-cols-2">
      <div v-for="n in 4" :key="n" class="card space-y-3 p-6">
        <div class="skeleton h-5 w-48" />
        <div class="skeleton h-4 w-full" />
        <div class="skeleton h-4 w-2/3" />
      </div>
    </div>

    <p
      v-else-if="!themes.length"
      class="rounded-2xl border-2 border-dashed border-slate-300/80 p-12 text-center text-sm text-slate-500"
    >
      Research themes will appear here once published.
    </p>

    <div v-else class="grid gap-5 md:grid-cols-2">
      <article
        v-for="theme in themes"
        :key="theme.id"
        class="card card-hover group flex flex-col p-6"
      >
        <span
          class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-md shadow-brand-600/20"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current stroke-2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <h2 class="mt-4 font-display text-base font-bold text-navy-900 dark:text-white">{{ theme.topic }}</h2>
        <p class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{{ theme.description }}</p>
        <div v-if="theme.methods?.length" class="mt-4 flex flex-wrap gap-1.5">
          <span
            v-for="method in theme.methods"
            :key="method"
            class="chip !border-brand-100 !bg-brand-50/80 !text-brand-700 dark:!border-brand-500/30 dark:!bg-brand-600/15 dark:!text-brand-300"
          >
            {{ method }}
          </span>
        </div>
        <RouterLink
          v-if="theme.url"
          :to="theme.url"
          target="_blank"
          rel="noopener"
          class="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-400"
        >
          Learn more ↗
        </RouterLink>
      </article>
    </div>

    <div class="flex flex-wrap gap-4">
      <RouterLink to="/publications" class="btn-primary">View Publications →</RouterLink>
      <RouterLink to="/projects" class="btn-outline">View Projects</RouterLink>
    </div>
  </div>
</template>
