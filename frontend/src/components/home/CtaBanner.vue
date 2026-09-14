<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section id="contact" class="scroll-mt-16 pb-20">
    <div class="container-site">
      <div
        class="panel-navy relative flex flex-wrap items-center justify-between gap-6 overflow-hidden p-8 sm:p-10"
      >
        <div class="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-600/25 blur-3xl" aria-hidden="true" />

        <div class="relative flex flex-wrap items-center gap-5">
          <span class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/40">
            <svg viewBox="0 0 24 24" class="h-6 w-6 fill-current" aria-hidden="true">
              <path d="M12 3a9 9 0 0 0-9 9 8.9 8.9 0 0 0 1.3 4.7L3 21l4.4-1.2A9 9 0 1 0 12 3zm-4 8h8v2H8zm0 4h5v2H8z" />
            </svg>
          </span>
          <div>
            <h2 class="font-display text-2xl font-extrabold text-white">Let's Work Together</h2>
            <p class="mt-1 text-sm text-slate-400">
              I'm open to new opportunities, collaboration, and exciting projects.
            </p>
          </div>
        </div>

        <RouterLink to="/contact" class="btn-outline-light relative">
          Get In Touch <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
