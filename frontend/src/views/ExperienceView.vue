<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Experience',
  description:
    'Professional career timeline of Asmare Belay — Lecturer and Researcher at Wollo University KIoT, hydro-meteorological data analyst and assistant lecturer.',
})

const loading = ref(true)
const error = ref('')
const experiences = ref([])

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

function range(item) {
  const start = item.start_date ? dateFormatter.format(new Date(item.start_date)) : ''
  const end = item.current ? 'Present' : item.end_date ? dateFormatter.format(new Date(item.end_date)) : ''
  return [start, end].filter(Boolean).join(' — ')
}

const professional = computed(() =>
  [...experiences.value]
    .filter((item) => (item.timeline_type || 'professional') === 'professional')
    .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0)),
)

const leadership = computed(() =>
  [...experiences.value]
    .filter((item) => item.timeline_type === 'leadership')
    .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0)),
)

const EMPLOYMENT_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  fellowship: 'Fellowship',
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/skills')
    experiences.value = res.data.experiences ?? []
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
        <p class="eyebrow !text-accent-400">Career</p>
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Professional Experience</h1>
        <p class="mt-2 text-sm text-slate-300">Academic and applied career in water resources engineering.</p>
      </div>
    </header>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <div v-if="loading" class="space-y-6">
      <div v-for="n in 3" :key="n" class="card space-y-4 p-6">
        <div class="skeleton h-5 w-64" />
        <div class="skeleton h-4 w-40" />
        <div class="skeleton h-16 w-full" />
      </div>
    </div>

    <template v-else>
      <!-- Professional timeline -->
      <section v-if="professional.length">
        <ol class="relative space-y-8 border-l-2 border-slate-100 pl-6 dark:border-white/10 sm:pl-8">
          <li v-for="item in professional" :key="item.id" class="relative">
            <span
              class="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 border-brand-600 bg-white dark:bg-navy-850 sm:-left-[39px]"
              aria-hidden="true"
            />
            <article class="card card-hover p-6">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 class="font-display text-lg font-bold text-navy-900 dark:text-white">
                    {{ item.title }}
                    <span
                      v-if="item.current"
                      class="ml-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    >
                      Current
                    </span>
                  </h2>
                  <p class="mt-0.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
                    {{ item.company }}
                    <span v-if="item.location" class="font-normal text-slate-400">· {{ item.location }}</span>
                  </p>
                </div>
                <div class="text-right">
                  <p class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                    {{ range(item) }}
                  </p>
                  <p v-if="item.employment_type && EMPLOYMENT_LABELS[item.employment_type]" class="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {{ EMPLOYMENT_LABELS[item.employment_type] }}
                  </p>
                </div>
              </div>

              <p v-if="item.description" class="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {{ item.description }}
              </p>

              <ul v-if="item.highlights?.length" class="mt-3 space-y-1.5">
                <li
                  v-for="(highlight, i) in item.highlights"
                  :key="i"
                  class="flex gap-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
                >
                  <span class="mt-1 text-brand-500" aria-hidden="true">▸</span>{{ highlight }}
                </li>
              </ul>
            </article>
          </li>
        </ol>
      </section>

      <p
        v-if="!professional.length && !leadership.length"
        class="rounded-2xl border-2 border-dashed border-slate-300/80 p-12 text-center text-sm text-slate-500"
      >
        No experience published yet.
      </p>

      <!-- Leadership & community -->
      <section v-if="leadership.length" class="pt-4">
        <div class="mb-6">
          <p class="eyebrow">Service</p>
          <h2 class="font-display text-2xl font-extrabold text-navy-900 dark:text-white">Leadership &amp; Community</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Committees, community service, training and academic contribution beyond formal roles.
          </p>
        </div>

        <ol class="relative space-y-6 border-l-2 border-slate-100 pl-6 dark:border-white/10 sm:pl-8">
          <li v-for="item in leadership" :key="item.id" class="relative">
            <span
              class="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 border-accent-500 bg-white dark:bg-navy-850 sm:-left-[39px]"
              aria-hidden="true"
            />
            <article class="card p-6">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 class="font-display text-base font-bold text-navy-900 dark:text-white">{{ item.title }}</h3>
                  <p v-if="item.company" class="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">{{ item.company }}</p>
                </div>
                <p class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  {{ range(item) }}
                </p>
              </div>
              <p v-if="item.description" class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {{ item.description }}
              </p>
              <ul v-if="item.highlights?.length" class="mt-3 space-y-1.5">
                <li
                  v-for="(highlight, i) in item.highlights"
                  :key="i"
                  class="flex gap-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
                >
                  <span class="mt-1 text-accent-500" aria-hidden="true">▸</span>{{ highlight }}
                </li>
              </ul>
            </article>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>
