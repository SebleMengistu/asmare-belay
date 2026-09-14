<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'
import { fmtDate } from '../utils/format'

useSeo({ title: 'Writing', description: 'Articles on teaching, software development and research.' })
import BasePagination from '../components/BasePagination.vue'

const loading = ref(true)
const error = ref('')
const posts = ref([])
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const activeTag = ref('')
const page = ref(1)

const tags = computed(() => {
  const map = new Map()
  for (const post of posts.value) {
    for (const tag of post.tags ?? []) {
      if (tag?.slug && tag?.name) map.set(tag.slug, tag.name)
    }
  }
  return [...map.entries()].map(([slug, name]) => ({ slug, name }))
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = { page: page.value }
    if (activeTag.value) params.tag = activeTag.value

    const res = await http.get('/posts', { params })
    posts.value = res.data ?? []
    pagination.value = res.meta?.pagination ?? { current_page: 1, last_page: 1, total: posts.value.length }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function setTag(slug) {
  activeTag.value = activeTag.value === slug ? '' : slug
  page.value = 1
  load()
}

function goTo(n) {
  if (n < 1 || n > pagination.value.last_page) return
  page.value = n
  load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-3">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Writing</h1>
      <p class="text-sm text-slate-500">{{ pagination.total }} published articles.</p>
      <div v-if="tags.length" class="flex flex-wrap gap-2">
        <button
          v-for="tag in tags"
          :key="tag.slug"
          class="rounded-full px-3 py-1 text-xs font-medium"
          :class="
            tag.slug === activeTag
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
              : 'ring-1 ring-slate-200 bg-white/70 text-slate-600 hover:bg-brand-50 hover:text-brand-700'
          "
          @click="setTag(tag.slug)"
        >
          #{{ tag.name }}
        </button>
      </div>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Loading posts…</p>
    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>
    <p v-else-if="!posts.length" class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
      Nothing published under this filter yet.
    </p>

    <template v-else>
      <ul class="space-y-4">
        <li v-for="post in posts" :key="post.id">
          <RouterLink
            :to="{ name: 'post', params: { slug: post.slug } }"
            class="card card-hover flex flex-col gap-3 sm:flex-row"
          >
            <img v-if="post.cover" :src="post.cover" alt="" class="h-28 w-full rounded-lg object-cover sm:w-48" />
            <div class="min-w-0 space-y-1">
              <h2 class="font-semibold text-slate-900">{{ post.title }}</h2>
              <p v-if="post.published_at" class="text-xs text-slate-400">{{ fmtDate(post.published_at, { long: true }) }}</p>
              <p v-if="post.excerpt" class="line-clamp-2 text-sm text-slate-600">{{ post.excerpt }}</p>
            </div>
          </RouterLink>
        </li>
      </ul>

      <BasePagination :current-page="pagination.current_page" :last-page="pagination.last_page" @change="goTo" />
    </template>
  </div>
</template>
