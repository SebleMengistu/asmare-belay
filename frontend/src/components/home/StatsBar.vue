<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  stats: { type: Array, default: () => [] }, // [{ value, suffix, label, icon }]
})

const animated = ref([])

const ICONS = {
  experience:
    'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z',
  projects:
    'M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.7 0-1 .1a4.2 4.2 0 0 1 2 3.4V19h7v-2.5c0-2.3-4.7-3.5-8-3.5z',
  publications:
    'M9 2h6a2 2 0 0 1 2 2h2a2 2 0 0 1 2 2v3h-2V6h-2.3A2 2 0 0 1 15 7H9a2 2 0 0 1-1.7-1H5v14h6v2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2-2zm1 4h4V4h-4zm9 5 5 5-1.4 1.4-2.6-2.6V22h-2v-7.2l-2.6 2.6L14 16z',
  technologies:
    'M19.4 13a7.8 7.8 0 0 0 0-2l2.1-1.6a.5.5 0 0 0 .1-.7l-2-3.4a.5.5 0 0 0-.6-.2l-2.5 1a7.7 7.7 0 0 0-1.7-1L14.4 2.5a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4L9 5.1a7.7 7.7 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.4a.5.5 0 0 0 .1.7L4.6 11a7.8 7.8 0 0 0 0 2l-2.1 1.6a.5.5 0 0 0-.1.7l2 3.4c.1.2.4.3.6.2l2.5-1a7.7 7.7 0 0 0 1.7 1l.4 2.6a.5.5 0 0 0 .5.4h4a.5.5 0 0 0 .5-.4l.4-2.6a7.7 7.7 0 0 0 1.7-1l2.5 1c.2.1.5 0 .6-.2l2-3.4a.5.5 0 0 0-.1-.7zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z',
  students:
    'M12 3 1 9l11 6 9-4.9V17h2V9zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8z',
}

let raf = null

function render(values) {
  animated.value = values.map((s) => ({ ...s }))
}

function animate() {
  if (typeof window === 'undefined') return
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    render(props.stats)
    return
  }

  const startedAt = performance.now()
  const duration = 1400

  const tick = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    render(props.stats.map((s) => ({ ...s, value: Math.round((s.target || 0) * eased) })))
    if (progress < 1) raf = requestAnimationFrame(tick)
  }

  raf = requestAnimationFrame(tick)
}

watch(
  () => props.stats,
  (next) => {
    if (!next?.length) return
    if (raf) cancelAnimationFrame(raf)
    animate()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div class="relative z-10">
    <div class="container-site">
      <dl
        class="card relative -mt-14 grid grid-cols-2 gap-y-2 !gap-x-0 p-0 shadow-xl shadow-navy-900/10 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-slate-100 dark:shadow-black/40 dark:lg:divide-white/5"
      >
        <div
          v-for="stat in animated"
          :key="stat.label"
          class="flex flex-col items-center gap-1.5 px-4 py-6 text-center"
        >
          <svg viewBox="0 0 24 24" class="h-7 w-7 fill-brand-600 dark:fill-brand-400" aria-hidden="true">
            <path :d="ICONS[stat.icon] || ICONS.technologies" />
          </svg>
          <dd class="font-display text-3xl font-extrabold text-navy-900 dark:text-white">
            {{ stat.value }}{{ stat.suffix || '+' }}
          </dd>
          <dt class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ stat.label }}</dt>
        </div>
      </dl>
    </div>
  </div>
</template>
