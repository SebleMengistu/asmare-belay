<script setup>
import { onMounted, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Conferences & Seminars',
  description: 'Conferences, seminars, workshops and presentations involving Asmare Belay.',
})

const loading = ref(true)
const error = ref('')
const events = ref([])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/conferences')
    events.value = res.data ?? []
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
        <p class="eyebrow !text-accent-400">Engagement</p>
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Conferences &amp; Seminars</h1>
        <p class="mt-2 text-sm text-slate-300">Talks, workshops and academic events.</p>
      </div>
    </header>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <div v-if="loading" class="space-y-5">
      <div v-for="n in 3" :key="n" class="card space-y-3 p-6">
        <div class="skeleton h-5 w-64" />
        <div class="skeleton h-4 w-48" />
      </div>
    </div>

    <div v-else-if="events.length" class="space-y-5">
      <article
        v-for="event in events"
        :key="event.id"
        class="card card-hover p-6"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="font-display text-base font-bold text-navy-900 dark:text-white">{{ event.name }}</h2>
            <p v-if="event.topic" class="mt-0.5 text-sm font-semibold text-brand-600 dark:text-brand-400">{{ event.topic }}</p>
          </div>
          <p v-if="event.event_date" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
            {{ event.event_date }}
          </p>
        </div>
        <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
          <span v-if="event.location">{{ event.location }}</span>
          <span v-if="event.role" class="chip">{{ event.role }}</span>
        </p>
        <p v-if="event.description" class="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {{ event.description }}
        </p>
        <a
          v-if="event.url"
          :href="event.url"
          target="_blank"
          rel="noopener"
          class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-400"
        >
          Event page ↗
        </a>
      </article>
    </div>

    <p
      v-else
      class="rounded-2xl border-2 border-dashed border-slate-300/80 p-12 text-center text-sm text-slate-500"
    >
      Conference and seminar records will appear here once published.
    </p>
  </div>
</template>
