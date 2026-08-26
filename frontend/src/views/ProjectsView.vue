<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

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

function stackOf(value) {
  return Array.isArray(value)
    ? value.filter(Boolean)
    : String(value || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
}

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
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
        <p class="text-sm text-slate-500">{{ pagination.total }} shipped works and experiments.</p>
      </div>
      <select
        v-model="activeCategory"
        class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">All categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Loading projects…</p>
    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>
    <p v-else-if="!projects.length" class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
      No projects published yet.
    </p>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="project in projects"
          :key="project.id"
          class="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <span v-if="project.category" class="mb-2 w-fit rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
            {{ project.category }}
          </span>
          <h2 class="font-semibold text-slate-900">{{ project.title }}</h2>
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

      <BasePagination :current-page="pagination.current_page" :last-page="pagination.last_page" @change="goTo" />
    </template>
  </div>
</template>
