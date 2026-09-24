<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  themes: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const items = computed(() => props.themes.slice(0, 6))
</script>

<template>
  <section id="research" class="scroll-mt-16 border-y border-slate-100 py-20 dark:border-white/5">
    <div class="container-site">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Research</p>
          <h2 class="section-title">Research Interests</h2>
          <p class="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Active areas of investigation spanning hydrological modeling, climate impacts and geospatial analysis.
          </p>
        </div>
        <RouterLink
          to="/research"
          class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-400"
        >
          All Research Themes <span aria-hidden="true">→</span>
        </RouterLink>
      </div>

      <div v-if="loading" class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 6" :key="n" class="card space-y-3 p-6">
          <div class="skeleton h-5 w-40" />
          <div class="skeleton h-4 w-full" />
        </div>
      </div>

      <p
        v-else-if="!items.length"
        class="mt-10 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-sm text-slate-400 dark:border-white/10"
      >
        Research themes will appear here once published.
      </p>

      <div v-else class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="theme in items"
          :key="theme.id"
          class="card card-hover group p-6"
        >
          <span
            class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-md shadow-brand-600/20"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current stroke-2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <h3 class="mt-4 font-display text-base font-bold text-navy-900 dark:text-white">{{ theme.topic }}</h3>
          <p class="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {{ theme.description }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
