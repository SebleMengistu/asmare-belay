<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { SOCIAL_PATHS, STROKE_ICONS, useSocials } from '../../composables/useSocials'

const props = defineProps({
  profile: { type: Object, default: null },
})

const FALLBACK_ROLES = ['IT Lecturer', 'Software Developer', 'Odoo Developer & Consultant', 'Researcher']

const roles = computed(() =>
  (Array.isArray(props.profile?.roles) && props.profile?.roles.length
    ? props.profile.roles
    : FALLBACK_ROLES),
)

const nameParts = computed(() => {
  const name = String(props.profile?.display_name || 'Tefera Alagaw').trim()
  const words = name.split(/\s+/)
  return { first: words[0] || 'Tefera', rest: words.slice(1).join(' ') || 'Alagaw' }
})

// Roles are displayed two per line, matching the mockup.
const roleLines = computed(() => {
  const lines = []
  for (let i = 0; i < roles.value.length; i += 2) {
    lines.push(roles.value.slice(i, i + 2).join('  |  '))
  }
  return lines
})

const avatar = computed(() => props.profile?.avatar || '')

const initials = computed(() =>
  nameParts.value.first[0]?.concat(nameParts.value.rest[0] || '').toUpperCase() || 'TG',
)

const socials = useSocials(props.profile)

function socialPath(key) {
  return key === 'email' && STROKE_ICONS.includes(key) ? SOCIAL_PATHS.emailStroke : SOCIAL_PATHS[key]
}

function isStrokeIcon(key) {
  return STROKE_ICONS.includes(key)
}
</script>


<template>
  <section id="home" class="circuit-bg relative scroll-mt-16 overflow-hidden">
    <!-- Vertical social rail -->
    <div
      class="absolute inset-y-0 right-5 z-20 hidden flex-col items-center justify-center gap-3 xl:flex"
      aria-label="Social links"
    >
      <a
        v-for="social in socials"
        :key="social.key"
        :href="social.href"
        :aria-label="social.label"
        target="_blank"
        rel="noopener"
        class="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition hover:border-brand-400 hover:bg-brand-600 hover:text-white"
      >
        <svg
          viewBox="0 0 24 24"
          class="h-4.5 w-4.5"
          :class="isStrokeIcon(social.key) ? 'fill-none stroke-current stroke-2' : 'fill-current'"
          aria-hidden="true"
        >
          <path :d="socialPath(social.key)" />
        </svg>
      </a>
    </div>

    <div class="container-site relative grid gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:items-center lg:py-24 xl:pr-20">
      <div class="lg:col-span-7">
        <p class="text-lg text-slate-300">Hello, I'm</p>

        <h1 class="mt-2 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {{ nameParts.first }}
          <span class="text-gradient">{{ nameParts.rest }}</span>
        </h1>

        <div class="mt-4 space-y-1">
          <p
            v-for="line in roleLines"
            :key="line"
            class="font-display text-base font-semibold text-white sm:text-lg"
          >
            {{ line }}
          </p>
        </div>

        <p class="mt-5 max-w-xl text-base leading-relaxed text-slate-400">
          {{ profile?.tagline || 'Building intelligent solutions, empowering students, delivering business value with Odoo, and advancing research for a better tomorrow.' }}
        </p>

        <div class="mt-8 flex flex-wrap gap-4">
          <RouterLink to="/projects" class="btn-primary">
            View My Work <span aria-hidden="true">→</span>
          </RouterLink>
          <RouterLink to="/contact" class="btn-outline-light">
            Contact Me <span aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </div>

      <div class="lg:col-span-5">
        <div class="relative mx-auto w-64 sm:w-72 lg:w-full lg:max-w-sm">
          <div class="absolute -inset-8 rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
          <div class="absolute -bottom-5 -right-5 h-28 w-28 rounded-3xl border-2 border-brand-500/50" aria-hidden="true" />
          <div class="absolute -left-5 -top-5 h-24 w-24 rounded-3xl border-2 border-accent-500/40" aria-hidden="true" />

          <img
            v-if="avatar"
            :src="avatar"
            :alt="`Portrait of ${nameParts.first} ${nameParts.rest}`"
            class="relative aspect-[4/5] w-full rounded-3xl bg-white object-contain object-top shadow-2xl shadow-navy-950/60 ring-1 ring-white/10"
          />
          <div
            v-else
            class="relative grid aspect-[4/5] w-full place-items-center rounded-3xl bg-gradient-to-br from-navy-800 via-navy-700 to-brand-900 shadow-2xl shadow-navy-950/60 ring-1 ring-white/10"
          >
            <div class="text-center">
              <span class="font-display text-7xl font-extrabold text-white">{{ initials }}</span>
              <p class="mt-3 px-8 text-sm text-slate-400">
                Upload a profile photo from the admin panel to replace this placeholder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
