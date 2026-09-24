<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'
import SkillIcon from '../components/SkillIcon.vue'

useSeo({
  title: 'Technologies & Skills',
  description: 'All technologies, tools and skills of Asmare Belay — hydrological modeling, GIS, remote sensing, programming and more.',
})

const loading = ref(true)
const error = ref('')
const skills = ref([])

const CATEGORIES = {
  modeling: 'Hydrological, Hydraulic & Groundwater Modeling',
  irrigation: 'Irrigation & Water Engineering',
  gis: 'Geospatial, GIS & Remote Sensing',
  programming: 'Programming & Data Analysis',
  research: 'Climate & Research Analysis',
  tools: 'Tools & Platforms',
  teaching: 'Teaching & Capacity Building',
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  general: 'General',
}

// Category accent dots — subtle color coding per group.
const CATEGORY_COLORS = {
  modeling: 'bg-brand-500',
  irrigation: 'bg-cyan-500',
  gis: 'bg-emerald-500',
  programming: 'bg-amber-500',
  research: 'bg-accent-500',
  tools: 'bg-slate-400',
  teaching: 'bg-violet-500',
}

const grouped = computed(() => {
  const map = {}
  for (const skill of [...skills.value].sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0))) {
    const key = skill.category || 'other'
    if (!map[key]) map[key] = []
    map[key].push(skill)
  }
  return map
})

const categoryKeys = computed(() => Object.keys(grouped.value))

const total = computed(() => skills.value.length)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/skills')
    skills.value = res.data.skills ?? []
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
        <p class="eyebrow !text-accent-400">Skills</p>
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Technologies &amp; Skills</h1>
        <p class="mt-2 text-sm text-slate-300">{{ loading ? 'Loading all skills…' : `${total} technologies, tools and capabilities.` }}</p>
      </div>
    </header>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <div v-if="loading" class="space-y-8">
      <div v-for="n in 3" :key="n" class="card space-y-4">
        <div class="skeleton h-5 w-40" />
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div v-for="m in 8" :key="m" class="skeleton h-28 w-full" />
        </div>
      </div>
    </div>

    <div v-else-if="skills.length">
      <section v-for="key in categoryKeys" :key="key" class="card mb-6">
        <h2 class="inline-flex items-center gap-2 font-display text-lg font-bold text-navy-900 dark:text-white">
          <span class="h-2.5 w-2.5 rounded-full" :class="CATEGORY_COLORS[key] || 'bg-brand-500'" aria-hidden="true" />
          {{ CATEGORIES[key] || key }}
        </h2>
        <p class="text-xs text-slate-400">{{ grouped[key].length }} skill{{ grouped[key].length === 1 ? '' : 's' }}</p>

        <ul class="mt-5 flex flex-wrap gap-2.5">
          <li
            v-for="skill in grouped[key]"
            :key="skill.id"
            class="group inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-white/10 dark:bg-navy-850"
          >
            <span
              class="h-2 w-2 shrink-0 rounded-full"
              :class="CATEGORY_COLORS[key] || 'bg-brand-500'"
              aria-hidden="true"
            />
            <span class="text-sm font-semibold text-navy-900 dark:text-white">{{ skill.name }}</span>
          </li>
        </ul>
      </section>
    </div>

    <p v-else class="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
      No skills published yet.
    </p>
  </div>
</template>