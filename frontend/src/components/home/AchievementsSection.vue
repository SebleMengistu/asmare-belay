<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  achievements: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const items = computed(() => props.achievements.slice(0, 3))

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' })

function formatDate(date) {
  if (!date) return ''
  try {
    return dateFormatter.format(new Date(date))
  } catch {
    return date
  }
}
</script>

<template>
  <section class="py-20">
    <div class="container-site">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Recognition</p>
          <h2 class="section-title">Achievements</h2>
        </div>
        <RouterLink
          to="/achievements"
          class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-400"
        >
          View All Achievements <span aria-hidden="true">→</span>
        </RouterLink>
      </div>

      <div v-if="loading" class="mt-10 grid gap-5 md:grid-cols-3">
        <div v-for="n in 3" :key="n" class="card space-y-3 p-6">
          <div class="skeleton h-5 w-48" />
          <div class="skeleton h-4 w-full" />
        </div>
      </div>

      <p
        v-else-if="!items.length"
        class="mt-10 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-sm text-slate-400 dark:border-white/10"
      >
        Achievements will appear here once published.
      </p>

      <div v-else class="mt-10 grid gap-5 md:grid-cols-3">
        <article
          v-for="achievement in items"
          :key="achievement.id"
          class="card card-hover group relative overflow-hidden p-6"
        >
          <div
            class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-accent-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          />
          <div class="flex items-start gap-4">
            <span
              class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/25"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current">
                <path d="M5 3h14v2h3v4a4 4 0 0 1-4 4h-.4A6 6 0 0 1 13 16.9V19h4v2H7v-2h4v-2.1A6 6 0 0 1 6.4 13H6a4 4 0 0 1-4-4V5h3V3zm-1 4v2a2 2 0 0 0 2 2V7H4zm16 0h-2v4a2 2 0 0 0 2-2V7z" />
              </svg>
            </span>
            <div class="min-w-0">
              <h3 class="font-display text-sm font-bold leading-snug text-navy-900 dark:text-white">
                {{ achievement.title }}
              </h3>
              <p v-if="formatDate(achievement.achieved_at) || achievement.category" class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span v-if="formatDate(achievement.achieved_at)">{{ formatDate(achievement.achieved_at) }}</span>
                <span
                  v-if="achievement.category"
                  class="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                >
                  {{ achievement.category }}
                </span>
              </p>
            </div>
          </div>
          <p v-if="achievement.description" class="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {{ achievement.description }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
