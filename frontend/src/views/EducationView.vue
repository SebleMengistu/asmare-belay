<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Education',
  description:
    'Academic background of Asmare Belay — MSc in Hydraulic and Water Resources Engineering (Bahir Dar Institute of Technology) and BSc in Water Resources and Irrigation Engineering (Wollo University).',
})

const loading = ref(true)
const error = ref('')
const educations = ref([])

const ordered = computed(() =>
  [...educations.value].sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0)),
)

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })
const month = (date) => dateFormatter.format(new Date(date))

function period(edu) {
  const start = edu.start_date ? month(edu.start_date) : ''
  const end = edu.end_date ? month(edu.end_date) : 'Present'
  return [start, end].filter(Boolean).join(' — ')
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/skills')
    educations.value = res.data.educations ?? []
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
        <p class="eyebrow !text-accent-400">Education</p>
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Academic Journey</h1>
        <p class="mt-2 text-sm text-slate-300">Degrees, specializations and thesis work.</p>
      </div>
    </header>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <div v-if="loading" class="grid gap-6">
      <div v-for="n in 2" :key="n" class="card space-y-4 p-6">
        <div class="skeleton h-5 w-64" />
        <div class="skeleton h-4 w-48" />
        <div class="skeleton h-16 w-full" />
      </div>
    </div>

    <p
      v-else-if="!ordered.length"
      class="rounded-2xl border-2 border-dashed border-slate-300/80 p-12 text-center text-sm text-slate-500"
    >
      No education entries published yet.
    </p>

    <ol v-else class="relative space-y-8 border-l-2 border-slate-100 pl-6 dark:border-white/10 sm:pl-8">
      <li v-for="edu in ordered" :key="edu.id" class="relative">
        <span
          class="absolute -left-[31px] top-1 grid h-8 w-8 place-items-center rounded-full border-4 border-brand-600 bg-white text-brand-700 dark:bg-navy-850 sm:-left-[39px]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current">
            <path d="M12 3 1 8l11 5 9-4.1V17h2V8zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.2z" />
          </svg>
        </span>

        <article class="card card-hover p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="font-display text-lg font-bold text-navy-900 dark:text-white">{{ edu.degree }}</h2>
              <p v-if="edu.field_of_study" class="mt-0.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
                Specialization: {{ edu.field_of_study }}
              </p>
            </div>
            <p class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
              {{ period(edu) }}
            </p>
          </div>

          <p class="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            {{ edu.institution }}
            <span v-if="edu.location" class="text-slate-400">· {{ edu.location }}</span>
          </p>

          <p
            v-if="edu.grade"
            class="mt-3 inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/80 px-3.5 py-2 text-xs font-bold text-brand-700 dark:border-brand-600/25 dark:bg-brand-600/15 dark:text-brand-300"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M12 2 15 8.3l7 .8-5.2 4.6L18.3 20 12 16.4 5.7 20l1.5-6.3L2 9.1l7-.8z" />
            </svg>
            {{ edu.grade }}
          </p>

          <p v-if="edu.description" class="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {{ edu.description }}
          </p>
        </article>
      </li>
    </ol>
  </div>
</template>
