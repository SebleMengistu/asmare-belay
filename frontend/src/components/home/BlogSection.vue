<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import http from '../../api/http'
import { fmtDate } from '../../utils/format'

const props = defineProps({
  posts: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

function categoryOf(post) {
  return post?.tags?.[0]?.name || 'Blog'
}

function authorName() {
  return 'Asmare Belay'
}

/* Newsletter ------------------------------------------------------------- */
const email = ref('')
const subscribing = ref(false)
const subscribed = ref(false)
const subscribeError = ref('')

async function subscribe() {
  subscribeError.value = ''
  const value = email.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    subscribeError.value = 'Please enter a valid email address.'
    return
  }

  subscribing.value = true
  try {
    // Reuses the public feedback pipeline; there is no dedicated newsletter table.
    await http.post('/feedback', {
      email: value,
      category: 'newsletter',
      message: `Newsletter subscription request from ${value}`,
    })
    subscribed.value = true
    email.value = ''
  } catch (e) {
    subscribeError.value = e.message || 'Subscription failed. Please try again.'
  } finally {
    subscribing.value = false
  }
}
</script>


<template>
  <section id="blog" class="scroll-mt-16 py-20">
    <div class="container-site grid gap-10 lg:grid-cols-3">
      <!-- Posts -->
      <div class="lg:col-span-2">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="eyebrow">Blog</p>
            <h2 class="section-title">Latest Blog Posts</h2>
          </div>
          <RouterLink
            to="/posts"
            class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-400"
          >
            View All Posts <span aria-hidden="true">→</span>
          </RouterLink>
        </div>

        <div v-if="loading" class="mt-8 space-y-6">
          <div v-for="n in 3" :key="n" class="card flex gap-5">
            <div class="skeleton h-28 w-40 shrink-0" />
            <div class="flex-1 space-y-2 py-1">
              <div class="skeleton h-4 w-3/4" />
              <div class="skeleton h-3 w-full" />
              <div class="skeleton h-3 w-1/2" />
            </div>
          </div>
        </div>

        <p
          v-else-if="!posts.length"
          class="mt-8 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-sm text-slate-400 dark:border-white/10"
        >
          No posts published yet — check back soon.
        </p>

        <div v-else class="mt-8 space-y-6">
          <article
            v-for="post in posts"
            :key="post.id"
            class="card card-hover flex flex-col gap-5 sm:flex-row"
          >
            <div class="relative h-44 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-40 dark:bg-navy-900">
              <img
                v-if="post.cover"
                :src="post.cover"
                :alt="`Cover for ${post.title}`"
                loading="lazy"
                class="h-full w-full object-cover"
              />
              <div v-else class="grid h-full w-full place-items-center bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500">
                <svg viewBox="0 0 24 24" class="h-8 w-8 fill-white/90" aria-hidden="true">
                  <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 4v2h12V8zm0 4v2h8v-2z" />
                </svg>
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <span class="chip !border-brand-100 !bg-brand-50/80 !text-brand-700 dark:!border-brand-500/30 dark:!bg-brand-600/15 dark:!text-brand-300">
                {{ categoryOf(post) }}
              </span>
              <h3 class="mt-2 font-display text-base font-bold leading-snug text-navy-900 dark:text-white">
                <RouterLink
                  :to="{ name: 'post', params: { slug: post.slug } }"
                  class="transition hover:text-brand-600 dark:hover:text-brand-400"
                >
                  {{ post.title }}
                </RouterLink>
              </h3>
              <p class="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {{ post.excerpt }}
              </p>
              <div class="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span class="grid h-6 w-6 place-items-center rounded-full bg-navy-900 font-display text-[10px] font-bold text-white">
                  AB
                </span>
                <span class="font-semibold text-slate-500 dark:text-slate-400">{{ authorName() }}</span>
                <span aria-hidden="true">•</span>
                <time :datetime="post.published_at">{{ fmtDate(post.published_at) }}</time>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- Newsletter -->
      <aside class="lg:col-span-1">
        <div class="panel-navy flex h-full flex-col p-7">
          <span class="grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/40">
            <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current stroke-2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
              <path d="m22 7-10 6L2 7" />
            </svg>
          </span>

          <h2 class="mt-5 font-display text-xl font-extrabold text-white">Stay Updated</h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-400">
            Subscribe to my newsletter for the latest updates and insights.
          </p>

          <form v-if="!subscribed" class="mt-6 space-y-3" novalidate @submit.prevent="subscribe">
            <input
              v-model="email"
              type="email"
              name="email"
              placeholder="Your email address"
              autocomplete="email"
              class="input"
            />
            <button type="submit" class="btn-primary w-full" :disabled="subscribing">
              {{ subscribing ? 'Subscribing…' : 'Subscribe' }}
            </button>
            <p v-if="subscribeError" class="text-xs font-medium text-red-400">{{ subscribeError }}</p>
          </form>

          <p
            v-else
            class="mt-6 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300"
          >
            ✓ You're subscribed. Thank you!
          </p>

          <p class="mt-auto pt-6 text-xs text-slate-500">
            No spam — just occasional, valuable updates. Unsubscribe anytime.
          </p>
        </div>
      </aside>
    </div>
  </section>
</template>
