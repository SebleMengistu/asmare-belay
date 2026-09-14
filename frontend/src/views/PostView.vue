<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'
import { fmtDate } from '../utils/format'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const post = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    const res = await http.get(`/posts/${route.params.slug}`)
    post.value = res.data

    const summary =
      post.value.excerpt || String(post.value.body || '').slice(0, 158)
    useSeo({
      title: post.value.title,
      description: summary,
      image: post.value.cover,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.value.title,
        description: summary,
        datePublished: post.value.published_at || undefined,
        image: post.value.cover || undefined,
      },
    })
  } catch (e) {
    if (e.status === 404) notFound.value = true
    else error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <p v-if="loading" class="text-sm text-slate-500">Loading article…</p>
    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <div v-else-if="notFound" class="space-y-3 py-16 text-center">
      <h1 class="text-2xl font-bold text-slate-900">Article not found</h1>
      <p class="text-sm text-slate-500">It may be a draft or the link is wrong.</p>
      <RouterLink to="/posts" class="inline-block text-sm font-medium">← Back to writing</RouterLink>
    </div>

    <article v-else-if="post" class="mx-auto max-w-2xl space-y-8">
      <header class="space-y-4">
        <RouterLink to="/posts" class="text-sm font-medium">← All writing</RouterLink>
        <h1 class="text-3xl font-bold leading-tight tracking-tight text-slate-900">{{ post.title }}</h1>
        <p v-if="post.published_at" class="text-sm text-slate-500">{{ fmtDate(post.published_at, { long: true }) }}</p>
        <div v-if="post.tags?.length" class="flex flex-wrap gap-1.5">
          <span
            v-for="tag in post.tags"
            :key="tag.id ?? tag.slug"
            class="chip hover:!border-brand-300 hover:!text-brand-700"
          >
            #{{ tag.name }}
          </span>
        </div>
      </header>

      <img v-if="post.cover" :src="post.cover" alt="" class="w-full rounded-xl border border-slate-200 object-cover" />

      <div class="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{{ post.body }}</div>
    </article>
  </div>
</template>
