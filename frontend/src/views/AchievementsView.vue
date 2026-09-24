<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Achievements',
  description:
    'Academic and professional achievements of Asmare Belay — distinction honors, research grants, capacity building and publications.',
})

const loading = ref(true)
const error = ref('')
const achievements = ref([])
const activeCategory = ref('')

const ordered = computed(() =>
  [...achievements.value].sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0)),
)

const categories = computed(() => [
  ...new Set(ordered.value.map((a) => a.category).filter(Boolean)),
])

const filtered = computed(() =>
  activeCategory.value ? ordered.value.filter((a) => a.category === activeCategory.value) : ordered.value,
)

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' })

function formatDate(date) {
  if (!date) return ''
  try {
    return dateFormatter.format(new Date(date))
  } catch {
    return date
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/achievements')
    achievements.value = res.data ?? []
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
      <div class="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
      <div class="relative">
        <p class="eyebrow !text-accent-400">Recognition</p>
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Achievements</h1>
        <p class="mt-2 text-sm text-slate-300">Awards, honors and documented milestones.</p>
      </div>
    </header>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <!-- Category filter -->
    <div v-if="categories.length > 1" class="flex flex-wrap gap-2">
      <button
        type="button"
        class="chip cursor-pointer transition"
        :class="activeCategory === '' ? '!border-brand-500 !bg-brand-600 !text-white' : ''"
        @click="activeCategory = ''"
      >
        All
      </button>
      <button
        v-for="cat in categories"
        :key="cat"
        type="button"
        class="chip cursor-pointer transition"
        :class="activeCategory === cat ? '!border-brand-500 !bg-brand-600 !text-white' : ''"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <div v-if="loading" class="grid gap-5 md:grid-cols-2">
      <div v-for="n in 4" :key="n" class="card space-y-3 p-6">
        <div class="skeleton h-5 w-56" />
        <div class="skeleton h-4 w-40" />
        <div class="skeleton h-12 w-full" />
      </div>
    </div>

    <p
      v-else-if="!filtered.length"
      class="rounded-2xl border-2 border-dashed border-slate-300/80 p-12 text-center text-sm text-slate-500"
    >
      No achievements published yet.
    </p>

    <div v-else class="grid gap-5 md:grid-cols-2">
      <article
        v-for="achievement in filtered"
        :key="achievement.id"
        class="card card-hover group relative overflow-hidden p-6"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-accent-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
        <div class="flex items-start gap-4">
          <span
            class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/25"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" class="h-6 w-6 fill-current">
              <path d="M5 3h14v2h3v4a4 4 0 0 1-4 4h-.4A6 6 0 0 1 13 16.9V19h4v2H7v-2h4v-2.1A6 6 0 0 1 6.4 13H6a4 4 0 0 1-4-4V5h3V3zm-1 4v2a2 2 0 0 0 2 2V7H4zm16 0h-2v4a2 2 0 0 0 2-2V7z" />
            </svg>
          </span>
          <div class="min-w-0">
            <h2 class="font-display text-base font-bold text-navy-900 dark:text-white">{{ achievement.title }}</h2>
            <p v-if="achievement.organization" class="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">
              {{ achievement.organization }}
            </p>
            <p v-if="formatDate(achievement.achieved_at) || achievement.category" class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span v-if="formatDate(achievement.achieved_at)">{{ formatDate(achievement.achieved_at) }}</span>
              <span
                v-if="achievement.category"
                class="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
              >
                {{ achievement.category }}
              </span>
            </p>
          </div>
        </div>
        <p v-if="achievement.description" class="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {{ achievement.description }}
        </p>
        <a
          v-if="achievement.url"
          :href="achievement.url"
          target="_blank"
          rel="noopener"
          class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-400"
        >
          View credential ↗
        </a>
      </article>
    </div>
  </div>
</template>
