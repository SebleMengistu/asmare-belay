<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'
import { stackOf } from '../utils/format'

useSeo({ title: 'Projects', description: 'Software projects, case studies and Odoo implementations.' })
import BasePagination from '../components/BasePagination.vue'

const loading = ref(true)
const error = ref('')
const projects = ref([])
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const activeCategory = ref('')
const page = ref(1)

const categories = computed(() =>
  [...new Set(projects.value.map((p) => p.category).filter(Boolean))].sort(),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = { page: page.value }
    if (activeCategory.value) params.category = activeCategory.value

    const res = await http.get('/projects', { params })
    projects.value = res.data ?? []
    pagination.value = res.meta?.pagination ?? { current_page: 1, last_page: 1, total: projects.value.length }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(activeCategory, () => {
  page.value = 1
  load()
})

function goTo(n) {
  if (n < 1 || n > pagination.value.last_page) return
  page.value = n
  load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-8">
    <header
      class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-950 px-6 py-10 shadow-xl shadow-brand-950/20 sm:px-10"
    >
      <div class="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
      <div class="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="eyebrow !text-accent-400">Portfolio</p>
          <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Projects</h1>
          <p class="mt-2 text-sm text-slate-300">{{ pagination.total }} shipped works and experiments.</p>
        </div>
        <select v-model="activeCategory" class="input !w-auto !border-white/20 !bg-white/10 !text-white [&>option]:text-slate-900">
          <option value="">All categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
    </header>

    <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="n in 6" :key="n" class="card space-y-3">
        <div class="skeleton h-5 w-24" />
        <div class="skeleton h-6 w-3/4" />
        <div class="skeleton h-4 w-full" />
        <div class="skeleton h-4 w-5/6" />
      </div>
    </div>
    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>
    <p v-else-if="!projects.length" class="rounded-2xl border-2 border-dashed border-slate-300/80 p-12 text-center text-sm text-slate-500">
      No projects published yet — check back soon.
    </p>

    <template v-else>
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="project in projects"
          :key="project.id"
          class="card card-hover flex flex-col"
        >
          <span v-if="project.category" class="chip mb-3 w-fit !border-brand-200 !bg-brand-50/80 !text-brand-700">
            {{ project.category }}
          </span>
          <h2 class="font-display text-base font-bold text-slate-900">{{ project.title }}</h2>
          <p v-if="project.summary" class="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-600">{{ project.summary }}</p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <span v-for="tech in stackOf(project.tech_stack).slice(0, 6)" :key="tech" class="chip">
              {{ tech }}
            </span>
          </div>
          <div class="mt-auto flex gap-4 pt-4 text-sm font-semibold">
            <RouterLink :to="{ name: 'project', params: { slug: project.slug } }" class="text-brand-600 transition hover:text-brand-800">
              Case study →
            </RouterLink>
            <a v-if="project.demo_url" :href="project.demo_url" target="_blank" rel="noopener" class="text-slate-500 transition hover:text-accent-600">Demo ↗</a>
            <a v-if="project.repo_url" :href="project.repo_url" target="_blank" rel="noopener" class="text-slate-500 transition hover:text-accent-600">Code ↗</a>
          </div>
        </article>
      </div>

      <BasePagination :current-page="pagination.current_page" :last-page="pagination.last_page" @change="goTo" />
    </template>
  </div>
</template>
