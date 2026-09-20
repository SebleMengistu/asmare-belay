<template>
  <div class="flex min-h-screen flex-col">
    <!-- Sticky navy navigation -->
    <header
      v-if="showChrome"
      class="sticky top-0 z-40 border-b border-white/5 bg-navy-900/95 shadow-lg shadow-navy-950/30 backdrop-blur"
    >
      <div class="container-site flex h-16 items-center justify-between gap-4">
        <RouterLink to="/" class="group flex shrink-0 items-center gap-2.5">
          <img
            src="/favicon.svg"
            alt="TEFERA logo"
            class="h-10 w-10 rounded-full shadow-lg shadow-brand-600/40 transition-transform duration-300 group-hover:scale-105"
          />
          <span class="leading-tight">
            <span class="block font-display text-lg font-extrabold tracking-wide text-white">TEFERA</span>
            <span class="block text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Portfolio</span>
          </span>
        </RouterLink>

        <nav class="hidden items-center gap-4 lg:flex xl:gap-5" aria-label="Primary">
          <template v-for="item in nav" :key="item.label">
            <!-- Dropdown group -->
            <div v-if="item.children" class="relative" data-dropdown-root @mouseenter="dropdownOpen = item.label" @mouseleave="dropdownOpen = null">
              <button
                type="button"
                class="nav-link flex items-center gap-1"
                :class="{ 'is-active': item.children.some(c => isActive(c)) }"
                :aria-expanded="dropdownOpen === item.label"
                :aria-haspopup="true"
              >
                {{ item.label }}
                <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5 transition-transform duration-200" :class="{ 'rotate-180': dropdownOpen === item.label }" aria-hidden="true">
                  <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clip-rule="evenodd" />
                </svg>
              </button>
              <Transition name="dropdown">
                <div
                  v-if="dropdownOpen === item.label"
                  class="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border border-white/10 bg-navy-900 py-1.5 shadow-xl shadow-navy-950/40"
                  role="menu"
                >
                  <RouterLink
                    v-for="child in item.children"
                    :key="child.label"
                    :to="child.to"
                    role="menuitem"
                    class="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                    :class="{ 'text-brand-400': isActive(child) }"
                    @click="dropdownOpen = null"
                  >
                    <svg viewBox="0 0 6 6" fill="currentColor" class="h-1.5 w-1.5 shrink-0 text-brand-500" aria-hidden="true"><circle cx="3" cy="3" r="3" /></svg>
                    {{ child.label }}
                  </RouterLink>
                </div>
              </Transition>
            </div>
            <!-- Regular link -->
            <RouterLink
              v-else
              :to="item.to"
              class="nav-link"
              :class="{ 'is-active': isActive(item) }"
            >
              {{ item.label }}
            </RouterLink>
          </template>
        </nav>

        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white"
            :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            <svg v-if="theme === 'dark'" viewBox="0 0 24 24" class="h-4.5 w-4.5 fill-current" aria-hidden="true">
              <path d="M12 7a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0-5v3m0 14v3M2 12h3m14 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <svg v-else viewBox="0 0 24 24" class="h-4.5 w-4.5 fill-current" aria-hidden="true">
              <path d="M20.7 14.9A8.6 8.6 0 0 1 9.1 3.3a1 1 0 0 0-1.3-1.2A10.5 10.5 0 1 0 22.2 16.2a1 1 0 0 0-1.5-1.3z" />
            </svg>
          </button>

          <a
            :href="cvDownloadUrl"
            download="Tefera-Alagaw-CV.pdf"
            target="_blank"
            rel="noopener"
            class="btn-outline-light hidden !py-2 sm:inline-flex"
          >Download CV</a>

          <button
            type="button"
            class="btn-ghost !p-2 !text-slate-300 hover:!bg-white/10 hover:!text-white lg:hidden"
            aria-label="Toggle navigation menu"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-6 w-6">
              <path v-if="!menuOpen" d="M4 7h16M4 12h16M4 17h16" />
              <path v-else d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile drawer -->
      <Transition name="drawer">
        <nav v-if="menuOpen" class="border-t border-white/10 bg-navy-900 px-4 pb-4 pt-2 lg:hidden">
          <template v-for="item in nav" :key="'m-' + item.label">
            <!-- Dropdown group — rendered as an accordion -->
            <div v-if="item.children">
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium transition"
                :class="item.children.some(c => isActive(c)) ? 'bg-brand-600/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                @click="mobileAccordion = mobileAccordion === item.label ? null : item.label"
              >
                {{ item.label }}
                <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 transition-transform duration-200" :class="{ 'rotate-180': mobileAccordion === item.label }" aria-hidden="true">
                  <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clip-rule="evenodd" />
                </svg>
              </button>
              <div v-if="mobileAccordion === item.label" class="ml-3 mt-0.5 border-l border-white/10 pl-3">
                <RouterLink
                  v-for="child in item.children"
                  :key="'m-child-' + child.label"
                  :to="child.to"
                  class="block rounded-lg px-3 py-2 text-sm font-medium transition"
                  :class="isActive(child) ? 'text-brand-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'"
                  @click="menuOpen = false; mobileAccordion = null"
                >
                  {{ child.label }}
                </RouterLink>
              </div>
            </div>
            <!-- Regular link -->
            <RouterLink
              v-else
              :to="item.to"
              class="block rounded-lg px-3 py-2.5 text-base font-medium transition"
              :class="isActive(item) ? 'bg-brand-600/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
              @click="menuOpen = false"
            >
              {{ item.label }}
            </RouterLink>
          </template>
          <a
            :href="cvDownloadUrl"
            download="Tefera-Alagaw-CV.pdf"
            target="_blank"
            rel="noopener"
            class="btn-primary mt-3 w-full"
          >Download CV</a>
        </nav>
      </Transition>
    </header>

    <main class="flex-1">
      <div v-if="showChrome" class="container-site py-10 sm:py-14"><RouterView /></div>
      <RouterView v-else />
    </main>

    <footer v-if="showChrome" class="border-t border-white/5 bg-navy-950 text-slate-300">
      <div class="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <!-- Brand -->
        <div>
          <RouterLink to="/" class="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="TEFERA logo" class="h-10 w-10 rounded-full" />
            <span class="leading-tight">
              <span class="block font-display text-lg font-extrabold tracking-wide text-white">TEFERA</span>
              <span class="block text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Portfolio</span>
            </span>
          </RouterLink>
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            IT Lecturer, Software Developer, Odoo Developer &amp; Consultant, Researcher dedicated to creating impact through technology and education.
          </p>
          <div class="mt-5 flex gap-2">
            <a
              v-for="social in footerSocials"
              :key="social.label"
              :href="social.href"
              :aria-label="social.label"
              target="_blank"
              rel="noopener"
              class="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:border-brand-500 hover:bg-brand-600 hover:text-white"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
                <path :d="social.path" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Quick links -->
        <nav aria-label="Quick links">
          <p class="font-display text-sm font-bold uppercase tracking-wider text-white">Quick Links</p>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li v-for="item in quickLinks" :key="item.label">
              <RouterLink :to="item.to" class="text-slate-400 transition hover:text-brand-400">{{ item.label }}</RouterLink>
            </li>
          </ul>
        </nav>

        <!-- Services -->
        <nav aria-label="Services">
          <p class="font-display text-sm font-bold uppercase tracking-wider text-white">Services</p>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li v-for="service in footerServices" :key="service.label">
              <RouterLink :to="service.to" class="text-slate-400 transition hover:text-brand-400">{{ service.label }}</RouterLink>
            </li>
          </ul>
        </nav>

        <!-- Contact info -->
        <div>
          <p class="font-display text-sm font-bold uppercase tracking-wider text-white">Contact Info</p>
          <ul class="mt-4 space-y-3 text-sm">
            <li v-for="row in footerContact" :key="row.label" class="flex items-start gap-2.5">
              <span class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-brand-400">
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-current" aria-hidden="true">
                  <path :d="row.path" />
                </svg>
              </span>
              <span class="text-slate-400">{{ row.value }}</span>
            </li>
          </ul>
        </div>

        <!-- Download CV -->
        <div>
          <p class="font-display text-sm font-bold uppercase tracking-wider text-white">Download CV</p>
          <p class="mt-4 text-sm leading-relaxed text-slate-400">
            Download my professional CV in PDF format.
          </p>
          <a
            :href="cvDownloadUrl"
            download="Tefera-Alagaw-CV.pdf"
            target="_blank"
            rel="noopener"
            class="btn-primary mt-4"
          >Download CV <span aria-hidden="true">⬇</span></a>
        </div>
      </div>

      <div class="border-t border-white/5 py-5">
        <div class="container-site flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
          <span>© {{ new Date().getFullYear() }} Tefera Alagaw. All rights reserved.</span>
          <span>Built with Laravel · Vue · PostgreSQL</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import http from './api/http'
import { useTheme } from './stores/theme'
import { REF_URLS, SOCIAL_PATHS, useSocials } from './composables/useSocials'

const route = useRoute()
const showChrome = computed(() => !route.matched.some((r) => r.meta?.chrome === false))
const menuOpen = ref(false)
const dropdownOpen = ref(null)
const mobileAccordion = ref(null)
const { theme, toggleTheme } = useTheme()
const profile = ref(null)

// Close desktop dropdown when clicking outside
function onDocClick(e) {
  if (!e.target.closest('[data-dropdown-root]')) dropdownOpen.value = null
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  // Fetch the profile so the footer contact block reflects the API.
  http
    .get('/profile')
    .then((res) => {
      profile.value = res.data
    })
    .catch(() => {})
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})

// Home sections are reached via hash anchors; pages via real routes.
const nav = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/#about' },
  {
    label: 'Expertise',
    children: [
      { label: 'Skill', to: '/#skills' },
      { label: 'Experience', to: '/#career' },
      { label: 'Research', to: '/#research' },
    ],
  },
  { label: 'Certification', to: '/#certification' },
  { label: 'Project', to: '/#development' },
  { label: 'Blog', to: '/#blog' },
  { label: 'Contact', to: '/contact' },
]

const quickLinks = nav.filter((item) =>
  ['About', 'Teaching', 'Development', 'Odoo', 'Research'].includes(item.label),
)

const footerServices = [
  { label: 'Software Development', to: '/services' },
  { label: 'Odoo Implementation', to: '/services' },
  { label: 'System Analysis', to: '/services' },
  { label: 'Training & Workshops', to: '/services' },
  { label: 'IT Consulting', to: '/services' },
]

const cvDownloadUrl = 'https://drive.google.com/uc?export=download&id=1L74ALZRo5IeAseGF3tybG-ECbCJWPij7'

const footerSocials = useSocials(profile)

const footerContact = computed(() => [
  { label: 'Location', value: profile.value?.location || REF_URLS.location, path: SOCIAL_PATHS.pin },
  { label: 'Email', value: profile.value?.email_public || REF_URLS.email, path: SOCIAL_PATHS.email },
  { label: 'Phone', value: profile.value?.phone || REF_URLS.phone, path: SOCIAL_PATHS.phone },
])

function isActive(item) {
  const [path, hash] = item.to.split('#')
  if (hash) return route.path === (path || '/') && route.hash === `#${hash}`
  if (item.to === '/') return route.path === '/' && !route.hash
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

watch(
  () => route.fullPath,
  (path) => {
    menuOpen.value = false
    // Lightweight page-view tracking against /api/v1/analytics. Silent by
    // design: telemetry must never break or surface in the UX.
    http
      .post('/analytics', {
        event: 'pageview',
        path,
        referrer: document.referrer || undefined,
      })
      .catch(() => {})
  },
  { immediate: true },
)
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
