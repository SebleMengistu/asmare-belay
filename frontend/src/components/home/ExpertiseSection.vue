<script setup>
import { RouterLink } from 'vue-router'

const EXPERTISE = [
  {
    id: '',
    icon: 'teaching',
    title: 'Teaching & Training',
    description:
      'Teaching hydrology, hydraulics, GIS and remote sensing, and delivering capacity-building training for government and community stakeholders.',
    link: '/#skills',
    linkLabel: 'Explore Skills',
  },
  {
    id: '',
    icon: 'development',
    title: 'Hydrological Modeling',
    description:
      'Building reliable models with SWAT/SWAT+, HEC-HMS, HEC-RAS, MODFLOW and HydroGeoSphere — from rainfall-runoff to surface–groundwater interaction.',
    link: '/#development',
    linkLabel: 'Explore Modeling',
  },
  {
    id: 'gis',
    icon: 'gis',
    title: 'GIS & Remote Sensing',
    description:
      'Geospatial analysis with ArcGIS/QGIS, Google Earth Engine and satellite data for land use change, flood mapping and water resources planning.',
    link: '/services',
    linkLabel: 'Explore GIS',
  },
  {
    id: '',
    icon: 'research',
    title: 'Research',
    description:
      'Publishing applied research in climate impact assessment, flood forecasting, water storage evaluation, and watershed management.',
    link: '/publications',
    linkLabel: 'Explore Research',
  },
]

const ICONS = {
  teaching:
    'M12 3 1 9l11 6 9-4.9V17h2V9zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8z',
  development: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16.2A6.2 6.2 0 1 1 18.2 12 6.2 6.2 0 0 1 12 18.2z',
  gis: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0zM12 3.5c-2 3-3.1 5-3.1 6.5a3.1 3.1 0 1 0 6.2 0c0-1.5-1.1-3.5-3.1-6.5z',
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
            :class="item.icon === 'gis' ? 'bg-[#0E7490] shadow-[#0E7490]/30' : 'bg-navy-900 shadow-navy-900/30 dark:bg-navy-800'"
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
