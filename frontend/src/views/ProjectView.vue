<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const project = ref(null)

const stackOf = (value) =>
  Array.isArray(value)
    ? value.filter(Boolean)
    : String(value || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

const period = computed(() => {
  const start = project.value?.start_date
  const end = project.value?.end_date
  return [start, end].filter(Boolean).join(' → ') || ''
})

async function load() {
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    const res = await http.get(`/projects/${route.params.slug}`)
    project.value = res.data

    const summary =
      project.value.summary || String(project.value.description || '').slice(0, 158)
    useSeo({
      title: project.value.title,
      description: summary,
      image: project.value.cover,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: project.value.title,
        description: summary,
        keywords: stackOf(project.value.tech_stack).join(', ') || undefined,
        url: window.location.href,
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
    <p v-if="loading" class="text-sm text-slate-500">Loading project…</p>
    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <div v-else-if="notFound" class="space-y-3 py-16 text-center">
      <h1 class="text-2xl font-bold text-slate-900">Project not found</h1>
      <p class="text-sm text-slate-500">It may be unpublished or the link is wrong.</p>
      <RouterLink to="/projects" class="inline-block text-sm font-medium">← Back to projects</RouterLink>
    </div>

    <article v-else-if="project" class="space-y-8">
      <header class="space-y-3">
        <RouterLink to="/projects" class="text-sm font-medium">← All projects</RouterLink>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-bold tracking-tight text-slate-900">{{ project.title }}</h1>
          <span v-if="project.category" class="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            {{ project.category }}
          </span>
          <span v-if="project.featured" class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            ★ Featured
          </span>
        </div>
        <p v-if="period" class="text-sm text-slate-500">{{ period }}</p>
        <div class="flex flex-wrap gap-3 pt-1">
          <a
            v-if="project.demo_url"
            :href="project.demo_url"
            target="_blank"
            rel="noopener"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Live demo ↗
          </a>
          <a
            v-if="project.repo_url"
            :href="project.repo_url"
            target="_blank"
            rel="noopener"
            class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Source code ↗
          </a>
        </div>
      </header>

      <div v-if="stackOf(project.tech_stack).length" class="flex flex-wrap gap-1.5">
        <span
          v-for="tech in stackOf(project.tech_stack)"
          :key="tech"
          class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
        >
          {{ tech }}
        </span>
      </div>

      <section v-if="project.description" class="whitespace-pre-line text-sm leading-relaxed text-slate-700">
        {{ project.description }}
      </section>

      <section v-if="project.skills?.length" class="space-y-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Skills applied</h2>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="skill in project.skills"
            :key="skill.id"
            class="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            :style="{ backgroundColor: skill.color || '#4f46e5' }"
          >
            {{ skill.name }}
          </span>
        </div>
      </section>

      <section v-if="project.screenshots?.length" class="space-y-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Screenshots</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <img
            v-for="shot in project.screenshots"
            :key="shot.id"
            :src="shot.card"
            alt=""
            class="w-full rounded-lg border border-slate-200 object-cover"
          />
        </div>
      </section>
    </article>
  </div>
</template>
