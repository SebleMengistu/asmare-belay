<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { categoryLabel, monogram, stackOf } from '../../utils/format'

const props = defineProps({
  projects: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

// Keep the homepage focused; the full catalog is available on /projects.
const items = computed(() => props.projects.slice(0, 4))
const failedImages = ref(new Set())

function screenshotOf(project) {
  if (failedImages.value.has(project?.id)) return ''
  return project?.screenshots?.[0]?.card || project?.screenshots?.[0]?.url || ''
}

function markImageFailed(project) {
  failedImages.value = new Set([...failedImages.value, project.id])
}

function monogramOf(project) {
  return monogram(project?.title)
}
</script>

<template>
  <section id="development" class="scroll-mt-16 py-20">
    <div class="container-site">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Portfolio</p>
          <h2 class="section-title">Featured Projects</h2>
        </div>
        <RouterLink
          to="/projects"
          class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-400"
        >
          See more <span aria-hidden="true">→</span>
        </RouterLink>
      </div>

      <div v-if="loading" class="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="n in 4" :key="n" class="card space-y-3 !p-0">
          <div class="skeleton h-44 w-full !rounded-b-none" />
          <div class="space-y-2 p-5">
            <div class="skeleton h-4 w-3/4" />
            <div class="skeleton h-3 w-full" />
            <div class="skeleton h-3 w-2/3" />
          </div>
        </div>
      </div>

      <p
        v-else-if="!items.length"
        class="mt-10 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-sm text-slate-400 dark:border-white/10"
      >
        No featured projects yet â publish some from the admin panel.
      </p>

      <div v-else class="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="project in items"
          :key="project.id"
          class="card card-hover group flex flex-col overflow-hidden !p-0"
        >
          <div class="relative h-44 overflow-hidden bg-slate-100 dark:bg-navy-900">
            <img
              v-if="screenshotOf(project)"
              :src="screenshotOf(project)"
              :alt="`Screenshot of ${project.title}`"
              loading="lazy"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              @error="markImageFailed(project)"
            />
            <div
              v-else
              class="grid h-full w-full place-items-center bg-gradient-to-br from-navy-800 via-brand-800 to-brand-600"
            >
              <span class="font-display text-4xl font-extrabold text-white/90">{{ monogramOf(project) }}</span>
            </div>
            <span
              class="absolute left-3 top-3 rounded-md bg-brand-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow"
            >
              {{ categoryLabel(project.category) }}
            </span>
          </div>

          <div class="flex flex-1 flex-col p-5">
            <h3 class="font-display text-base font-bold text-navy-900 dark:text-white">
              <RouterLink
                :to="{ name: 'project', params: { slug: project.slug } }"
                class="transition hover:text-brand-600 dark:hover:text-brand-400"
              >
                {{ project.title }}
              </RouterLink>
            </h3>
            <p class="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ project.summary }}
            </p>
            <p class="mt-4 text-xs font-medium text-slate-400 dark:text-slate-500">
              {{ stackOf(project.tech_stack).slice(0, 4).join('  â¢  ') }}
            </p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
