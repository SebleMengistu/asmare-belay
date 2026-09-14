<script setup>
import { RouterLink } from 'vue-router'

const EXPERTISE = [
  {
    id: '',
    icon: 'teaching',
    title: 'Teaching',
    description:
      'Delivering engaging lectures, mentoring students, and developing modern curricula for the next generation of IT professionals.',
    link: '/#skills',
    linkLabel: 'Explore Skills',
  },
  {
    id: '',
    icon: 'development',
    title: 'Software Development',
    description:
      'Building robust, scalable web applications and systems with clean architecture, from concept to deployment.',
    link: '/#development',
    linkLabel: 'Explore Development',
  },
  {
    id: 'odoo',
    icon: 'odoo',
    title: 'Odoo Consulting',
    description:
      'Implementing, customising, and integrating Odoo ERP to streamline business processes and drive real value.',
    link: '/services',
    linkLabel: 'Explore Odoo',
  },
  {
    id: '',
    icon: 'research',
    title: 'Research',
    description:
      'Publishing applied research in smart education, data classification, and ICT to advance knowledge and practice.',
    link: '/publications',
    linkLabel: 'Explore Research',
  },
]

const ICONS = {
  teaching:
    'M12 3 1 9l11 6 9-4.9V17h2V9zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8z',
  development: 'M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6z',
  odoo: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16.2A6.2 6.2 0 1 1 18.2 12 6.2 6.2 0 0 1 12 18.2z',
  research:
    'M9 2v6.2L3.6 18a3 3 0 0 0 2.6 4.5h11.6A3 3 0 0 0 20.4 18L15 8.2V2zm2 2h2v2h-2zm0 4.8 2.4 4.2h-2.3a4.5 4.5 0 0 1-3.2-1.3L11 8.8zM6.2 20.5a1 1 0 0 1-.9-1.5l1.5-2.6a6.5 6.5 0 0 0 4.3 1.6h4.6l1.1 1a1 1 0 0 1-.9 1.5z',
}
</script>

<template>
  <section id="expertise" class="dots-bg scroll-mt-16 border-y border-slate-100 py-20 dark:border-white/5">
    <div class="container-site">
      <div class="mx-auto max-w-2xl text-center">
        <p class="eyebrow">What I Do</p>
        <h2 class="section-title">My Expertise</h2>
      </div>

      <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="item in EXPERTISE"
          :id="item.id || null"
          :key="item.title"
          class="card card-hover flex scroll-mt-24 flex-col"
        >
          <span
            class="grid h-14 w-14 place-items-center rounded-xl text-white shadow-md"
            :class="item.icon === 'odoo' ? 'bg-[#714B67] shadow-[#714B67]/30' : 'bg-navy-900 shadow-navy-900/30 dark:bg-navy-800'"
          >
            <svg viewBox="0 0 24 24" class="h-7 w-7 fill-current" aria-hidden="true">
              <path :d="ICONS[item.icon]" />
            </svg>
          </span>

          <h3 class="mt-5 font-display text-lg font-bold text-navy-900 dark:text-white">{{ item.title }}</h3>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {{ item.description }}
          </p>

          <RouterLink
            :to="item.link"
            class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {{ item.linkLabel }} <span aria-hidden="true">→</span>
          </RouterLink>
        </article>
      </div>
    </div>
  </section>
</template>
