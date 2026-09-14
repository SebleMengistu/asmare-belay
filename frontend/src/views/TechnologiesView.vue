<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'
import SkillIcon from '../components/SkillIcon.vue'

useSeo({
  title: 'Technologies & Skills',
  description: 'All technologies, tools and skills of Tefera Alagaw — backend, frontend, database, security and more.',
})

const loading = ref(true)
const error = ref('')
const skills = ref([])

const CATEGORIES = {
  backend: 'Backend',
  frontend: 'Frontend',
  database: 'Database',
  security: 'Security & Networking',
  networking: 'Networking',
  tools: 'Tools & Platforms',
  lms: 'LMS & Learning',
  teaching: 'Teaching',
  odoo: 'Odoo',
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
          <span class="h-2.5 w-2.5 rounded-full bg-brand-500" aria-hidden="true" />
          {{ CATEGORIES[key] || key }}
        </h2>
        <p class="text-xs text-slate-400">{{ grouped[key].length }} skill{{ grouped[key].length === 1 ? '' : 's' }}</p>

        <ul class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <li
            v-for="skill in grouped[key]"
            :key="skill.id"
            class="group flex flex-col rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-white/10"
          >
            <div class="flex items-center gap-3">
              <SkillIcon :name="skill.name" tile-class="h-9 w-9 shrink-0" />
              <span class="text-sm font-bold leading-tight text-navy-900 dark:text-white">{{ skill.name }}</span>
            </div>
            <div class="mt-3">
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                  :style="{ width: `${skill.level ?? 0}%` }"
                />
              </div>
              <p class="mt-1 text-right text-[10px] font-semibold text-slate-400">{{ skill.level ?? 0 }}%</p>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <p v-else class="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
      No skills published yet.
    </p>
  </div>
</template>