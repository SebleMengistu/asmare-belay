<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Teaching & Experience',
  description: 'Academic career, teaching highlights, education and certifications of Asmare Belay.',
})

const loading = ref(true)
const error = ref('')
const experiences = ref([])

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

function range(item) {
  const start = item.start_date ? dateFormatter.format(new Date(item.start_date)) : ''
  const end = item.current ? 'Present' : item.end_date ? dateFormatter.format(new Date(item.end_date)) : ''
  return [start, end].filter(Boolean).join(' — ')
}

const orderedExperiences = computed(() =>
  [...experiences.value].sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0)),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/skills')
    experiences.value = res.data.experiences ?? []
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
        <p class="eyebrow !text-accent-400">Career</p>
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Teaching &amp; Experience</h1>
        <p class="mt-2 text-sm text-slate-300">Seven years of teaching, building, and mentoring.</p>
      </div>
    </header>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <div v-if="loading" class="grid gap-8 lg:grid-cols-2">
      <div v-for="n in 2" :key="n" class="card space-y-4">
        <div class="skeleton h-5 w-40" />
        <div v-for="m in 3" :key="m" class="skeleton h-16 w-full" />
      </div>
    </div>

    <div v-else class="grid gap-8 lg:grid-cols-2">
      <!-- Experience -->
      <section class="card lg:col-span-2">
        <h2 class="font-display text-lg font-bold text-navy-900 dark:text-white">Experience</h2>
        <p v-if="!orderedExperiences.length" class="mt-4 text-sm text-slate-400">No experience published yet.</p>
        <ol v-else class="relative mt-5 space-y-7 border-l-2 border-slate-100 pl-6 dark:border-white/10">
          <li v-for="item in orderedExperiences" :key="item.id" class="relative">
            <span
              class="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 border-brand-600 bg-white dark:bg-navy-850"
              aria-hidden="true"
            />
            <p class="text-xs font-bold uppercase tracking-wide text-slate-400">{{ range(item) }}</p>
            <h3 class="mt-1 font-display text-base font-bold text-navy-900 dark:text-white">
              {{ item.title }}
              <span v-if="item.company" class="text-brand-600 dark:text-brand-400"> · {{ item.company }}</span>
            </h3>
            <p v-if="item.description" class="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ item.description }}
            </p>
            <ul v-if="item.highlights?.length" class="mt-2 space-y-1">
              <li v-for="(highlight, i) in item.highlights" :key="i" class="flex gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span class="text-brand-500" aria-hidden="true">▸</span>{{ highlight }}
              </li>
            </ul>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>
