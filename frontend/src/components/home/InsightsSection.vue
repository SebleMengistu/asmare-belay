<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SkillIcon from '../SkillIcon.vue'

const props = defineProps({
  publications: { type: Array, default: () => [] },
  skills: { type: Array, default: () => [] },
  experiences: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const publications = computed(() =>
  [...props.publications]
    .sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
    .slice(0, 4),
)

const experiences = computed(() =>
  [...props.experiences]
    .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0))
    .slice(0, 5),
)

const skills = computed(() =>
  [...props.skills]
    .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0))
    .slice(0, 15),
)

function formatDates(start, end, current) {
  const year = (date) => date?.slice(0, 4)
  if (current) return `${year(start)} — Present`
  return end ? `${year(start)} — ${year(end)}` : year(start)
}
</script>

<template>
  <section id="research" class="dots-bg scroll-mt-16 border-y border-slate-100 py-20 dark:border-white/5">
    <div class="container-site grid gap-8 lg:grid-cols-3">
      <!-- Publications timeline -->
      <div class="card">
        <div class="flex items-center justify-between">
          <h2 class="font-display text-lg font-bold text-navy-900 dark:text-white">Research &amp; Publications</h2>
          <RouterLink
            to="/publications"
            class="text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
          >
            View All →
          </RouterLink>
        </div>

        <div v-if="loading" class="mt-5 space-y-5">
          <div v-for="n in 4" :key="n" class="skeleton h-4 w-full" />
        </div>

        <ol v-else-if="publications.length" class="relative mt-6 space-y-6 border-l-2 border-slate-100 pl-6 dark:border-white/10">
          <li v-for="pub in publications" :key="pub.id" class="relative">
            <span
              class="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-4 border-brand-600 bg-white dark:bg-navy-850"
              aria-hidden="true"
            />
            <p class="text-xs font-bold text-slate-400">{{ pub.year }}</p>
            <RouterLink
              v-if="pub.slug"
              :to="{ name: 'publications' }"
              class="mt-0.5 block text-sm font-semibold leading-snug text-navy-900 transition hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
            >
              {{ pub.title }}
            </RouterLink>
            <p v-else class="mt-0.5 text-sm font-semibold leading-snug text-navy-900 dark:text-white">{{ pub.title }}</p>
            <p class="mt-0.5 text-xs text-slate-400">{{ pub.venue }}</p>
          </li>
        </ol>

        <p v-else class="mt-5 text-sm text-slate-400">No publications published yet.</p>
      </div>

      <!-- Teaching highlights -->
      <div id="career" class="card scroll-mt-16">
        <div class="flex items-center justify-between">
          <h2 class="font-display text-lg font-bold text-navy-900 dark:text-white">Experience</h2>
          <RouterLink to="/experience" class="text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400">
            View All →
          </RouterLink>
        </div>

        <div v-if="loading" class="mt-5 space-y-5">
          <div v-for="n in 3" :key="n" class="skeleton h-4 w-full" />
        </div>

        <ol v-else-if="experiences.length" class="relative mt-6 space-y-6 border-l-2 border-slate-100 pl-6 dark:border-white/10">
          <li v-for="exp in experiences" :key="exp.id" class="relative">
            <span
              class="absolute -left-[31px] top-0.5 grid h-4 w-4 place-items-center rounded-full border-4 border-brand-600 bg-white dark:bg-navy-850"
              aria-hidden="true"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-brand-600" />
            </span>
            <p class="text-xs font-bold text-slate-400">{{ formatDates(exp.start_date, exp.end_date, exp.current) }}</p>
            <p class="mt-0.5 text-sm font-semibold leading-snug text-navy-900 dark:text-white">{{ exp.title }}</p>
            <p class="mt-0.5 text-xs text-slate-400">{{ exp.company }}{{ exp.location ? ` · ${exp.location}` : '' }}</p>
          </li>
        </ol>

        <p v-else class="mt-5 text-sm text-slate-400">No experience entries yet.</p>
      </div>

      <!-- Technologies & skills -->
      <div id="skills" class="panel-navy p-6 scroll-mt-16">
        <div class="flex items-center justify-between">
          <h2 class="font-display text-lg font-bold text-white">Technologies &amp; Skills</h2>
          <RouterLink
            to="/technologies"
            class="text-xs font-semibold text-brand-400 transition hover:text-brand-300"
          >
            View All →
          </RouterLink>
        </div>

        <div v-if="loading" class="mt-5 grid grid-cols-3 gap-3">
          <div v-for="n in 9" :key="n" class="skeleton h-16 w-full" />
        </div>

        <ul v-else-if="skills.length" class="mt-5 grid grid-cols-3 gap-3">
          <li
            v-for="skill in skills"
            :key="skill.id"
            class="flex flex-col items-center gap-2 rounded-xl bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <SkillIcon :name="skill.name" tile-class="h-7 w-7" />
            <span class="text-center text-[11px] font-bold leading-tight text-navy-900">{{ skill.name }}</span>
          </li>
        </ul>

        <p v-else class="mt-5 text-sm text-slate-200/80">No skills added yet.</p>
      </div>
    </div>
  </section>
</template>
