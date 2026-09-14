<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({ title: 'Search', robots: 'noindex, nofollow' })

const route = useRoute()
const router = useRouter()

const query = ref(String(route.query.q ?? ''))
const loading = ref(false)
const error = ref('')
const results = ref({ projects: [], posts: [], publications: [], services: [] })
const activeCategory = ref('all')

const groups = [
  { key: 'projects', label: 'Projects' },
  { key: 'posts', label: 'Blog posts' },
  { key: 'publications', label: 'Publications' },
  { key: 'services', label: 'Services' },
]

function count(key) {
  return results.value[key]?.length ?? 0
}

// computed so Vue re-evaluates reactively when results change
const total = computed(() => groups.reduce((sum, g) => sum + count(g.key), 0))

function visible(key) {
  if (activeCategory.value === 'all') return true
  return activeCategory.value === key
}

async function runSearch() {
  const q = query.value.trim()
  if (q.length < 2) {
    error.value = ''
    results.value = { projects: [], posts: [], publications: [], services: [] }
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/search', { params: { q } })
    results.value = res.data ?? { projects: [], posts: [], publications: [], services: [] }
  } catch (e) {
    error.value = e.message
    results.value = { projects: [], posts: [], publications: [], services: [] }
  } finally {
    loading.value = false
  }
}

function toggleCategory(key) {
  activeCategory.value = activeCategory.value === key ? 'all' : key
}

function submit() {
  router.replace({ query: { q: query.value } })
  runSearch()
}

onMounted(() => {
  if (query.value.trim()) runSearch()
})

watch(
  () => route.query.q,
  (q) => {
    query.value = String(q ?? '')
    if (query.value.trim()) runSearch()
  },
)
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-3">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Search</h1>
      <form class="flex max-w-xl gap-2" @submit.prevent="submit">
        <input
          v-model.trim="query"
          type="search"
          placeholder="Search projects, posts, publications…"
          class="input flex-1"
        />
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Searching…' : 'Search' }}
        </button>
      </form>
    </header>

    <div v-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <p v-else-if="query.length < 2" class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
      Type at least 2 characters to search.
    </p>

    <template v-else-if="!loading">
      <p class="text-sm text-slate-500">
        {{ total }} result{{ total === 1 ? '' : 's' }} for "{{ query }}".
      </p>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-full px-3 py-1 text-xs font-medium"
          :class="activeCategory === 'all' ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30' : 'ring-1 ring-slate-200 bg-white/70 text-slate-600 hover:bg-brand-50 hover:text-brand-700'"
          @click="activeCategory = 'all'"
        >
          All ({{ total }})
        </button>
        <button
          v-for="g in groups"
          :key="g.key"
          type="button"
          class="rounded-full px-3 py-1 text-xs font-medium"
          :class="activeCategory === g.key ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30' : 'ring-1 ring-slate-200 bg-white/70 text-slate-600 hover:bg-brand-50 hover:text-brand-700'"
          @click="toggleCategory(g.key)"
        >
          {{ g.label }} ({{ count(g.key) }})
        </button>
      </div>

      <p v-if="total === 0" class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No results found.
      </p>

      <section v-for="g in groups" :key="g.key" v-show="visible(g.key)" class="space-y-3">
        <template v-if="results[g.key]?.length">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">{{ g.label }}</h2>
          <ul class="space-y-3">
            <li v-for="item in results[g.key]" :key="item.id">
              <RouterLink
                v-if="g.key === 'projects'"
                :to="{ name: 'project', params: { slug: item.slug } }"
                class="card card-hover block p-5"
              >
                <p class="font-semibold text-slate-900">{{ item.title }}</p>
                <p v-if="item.summary" class="mt-1 line-clamp-2 text-sm text-slate-600">{{ item.summary }}</p>
              </RouterLink>
              <RouterLink
                v-else-if="g.key === 'posts'"
                :to="{ name: 'post', params: { slug: item.slug } }"
                class="card card-hover block p-5"
              >
                <p class="font-semibold text-slate-900">{{ item.title }}</p>
                <p v-if="item.excerpt" class="mt-1 line-clamp-2 text-sm text-slate-600">{{ item.excerpt }}</p>
                <p v-if="item.tags?.length" class="mt-2 flex gap-2 text-xs text-slate-400">
                  <span v-for="tag in item.tags" :key="tag.id">#{{ tag.name }}</span>
                </p>
              </RouterLink>
              <div v-else class="card block p-5">
                <p class="font-semibold text-slate-900">{{ item.title }}</p>
                <p v-if="item.authors || item.venue" class="mt-1 text-xs text-slate-400">
                  {{ [item.authors, item.venue, item.year].filter(Boolean).join(' — ') }}
                </p>
                <p v-if="item.summary" class="mt-1 line-clamp-2 text-sm text-slate-600">{{ item.summary }}</p>
              </div>
            </li>
          </ul>
        </template>
      </section>
    </template>
  </div>
</template>
