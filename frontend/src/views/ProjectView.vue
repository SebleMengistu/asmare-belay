<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'
import { stackOf } from '../utils/format'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const project = ref(null)

const period = computed(() => {
  const start = project.value?.start_date
  const end = project.value?.end_date
  return [start, end].filter(Boolean).join(' → ') || ''
})

// Case-study sections render only when the API actually returns data —
// the content rule is: never fabricate what isn't in the database.
const caseSections = computed(() => {
  const p = project.value || {}
  return [
    { key: 'problem', title: 'The Problem', items: null, text: p.problem },
    { key: 'objectives', title: 'Objectives', items: p.objectives },
    { key: 'methods', title: 'Methodology', items: p.methods },
    { key: 'challenges', title: 'Challenges', items: p.challenges },
    { key: 'solutions', title: 'Solutions', items: p.solutions },
    { key: 'results', title: 'Results & Outcomes', items: p.results },
  ].filter((section) => (section.items?.length || section.text))
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
      image: project.value.screenshots?.[0]?.card || undefined,
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

    <article v-else-if="project" class="space-y-10">
      <!-- ── 1. Overview header ─────────────────────────────────────────── -->
      <header class="space-y-4">
        <RouterLink to="/projects" class="text-sm font-medium">← All projects</RouterLink>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ project.title }}</h1>
          <span v-if="project.category" class="chip !border-brand-200 !bg-brand-50/80 !text-brand-700 dark:!border-brand-500/30 dark:!bg-brand-600/15 dark:!text-brand-300">
            {{ project.category }}
          </span>
          <span v-if="project.status" class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            {{ project.status }}
          </span>
          <span v-if="project.featured" class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            ★ Featured
          </span>
        </div>
        <p v-if="project.summary" class="max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          {{ project.summary }}
        </p>
        <p v-if="period" class="text-sm text-slate-500">{{ period }}</p>
        <div class="flex flex-wrap gap-3 pt-1">
          <a
            v-if="project.demo_url"
            :href="project.demo_url"
            target="_blank"
            rel="noopener"
            class="btn-primary"
          >
            Live demo ↗
          </a>
          <a
            v-if="project.repo_url"
            :href="project.repo_url"
            target="_blank"
            rel="noopener"
            class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
          >
            Source code ↗
          </a>
          <a
            v-if="project.documentation_url"
            :href="project.documentation_url"
            target="_blank"
            rel="noopener"
            class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
          >
            Documentation ↗
          </a>
          <a
            v-if="project.video_url"
            :href="project.video_url"
            target="_blank"
            rel="noopener"
            class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
          >
            Video ↗
          </a>
        </div>
      </header>

      <!-- Meta grid: role / organization / technologies -->
      <div class="grid gap-4 sm:grid-cols-3">
        <div v-if="project.role" class="card p-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">My Role</p>
          <p class="mt-1.5 text-sm font-semibold text-navy-900 dark:text-white">{{ project.role }}</p>
        </div>
        <div v-if="project.organization" class="card p-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Organization</p>
          <p class="mt-1.5 text-sm font-semibold text-navy-900 dark:text-white">{{ project.organization }}</p>
        </div>
        <div v-if="stackOf(project.tech_stack).length" class="card p-5 sm:col-span-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Technologies &amp; Methods</p>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="tech in stackOf(project.tech_stack)"
              :key="tech"
              class="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300"
            >
              {{ tech }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── 2. Full description ────────────────────────────────────────── -->
      <section v-if="project.description" class="space-y-2">
        <h2 class="font-display text-xl font-bold text-navy-900 dark:text-white">Project Overview</h2>
        <p class="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {{ project.description }}
        </p>
      </section>

      <!-- ── 3-10. Case study sections (rendered only when populated) ──── -->
      <section
        v-for="section in caseSections"
        :key="section.key"
        class="space-y-3"
      >
        <h2 class="font-display text-xl font-bold text-navy-900 dark:text-white">{{ section.title }}</h2>
        <p v-if="section.text" class="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {{ section.text }}
        </p>
        <ul v-if="section.items?.length" class="max-w-3xl space-y-2">
          <li
            v-for="(item, i) in section.items"
            :key="i"
            class="flex gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
          >
            <span
              class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600/10 text-[10px] font-bold text-brand-700 dark:text-brand-300"
              aria-hidden="true"
            >
              {{ i + 1 }}
            </span>
            {{ item }}
          </li>
        </ul>
      </section>

      <!-- Skills applied -->
      <section v-if="project.skills?.length" class="space-y-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Skills applied</h2>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="skill in project.skills"
            :key="skill.id"
            class="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            :style="{ backgroundColor: skill.color || '#0d8489' }"
          >
            {{ skill.name }}
          </span>
        </div>
      </section>

      <!-- Screenshots -->
      <section v-if="project.screenshots?.length" class="space-y-2">
        <h2 class="font-display text-xl font-bold text-navy-900 dark:text-white">Screenshots</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <img
            v-for="shot in project.screenshots"
            :key="shot.id"
            :src="shot.card"
            alt=""
            loading="lazy"
            class="w-full rounded-lg border border-slate-200 object-cover dark:border-white/10"
          />
        </div>
      </section>
    </article>
  </div>
</template>
