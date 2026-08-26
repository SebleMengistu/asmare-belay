<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../../api/http'

const loading = ref(true)
const error = ref('')
const data = ref(null)

const counts = computed(() => [
  { label: 'Projects', value: data.value?.counts?.projects ?? 0, accent: 'text-indigo-700' },
  { label: 'Posts', value: data.value?.counts?.posts ?? 0, accent: 'text-slate-900' },
  { label: 'Published posts', value: data.value?.counts?.published_posts ?? 0, accent: 'text-emerald-700' },
  { label: 'Messages', value: data.value?.counts?.messages ?? 0, accent: 'text-slate-900' },
  { label: 'Unread messages', value: data.value?.counts?.unread_messages ?? 0, accent: 'text-amber-600' },
])

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/admin/dashboard')
    data.value = res.data
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-8">
    <header>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      <p class="text-sm text-slate-500">Everything happening across your portfolio.</p>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Loading dashboard…</p>
    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <template v-else-if="data">
      <section v-if="data.profile" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-semibold text-slate-900">{{ data.profile.display_name }}</span>
          <span v-if="data.profile.headline" class="text-sm text-slate-500">{{ data.profile.headline }}</span>
          <span
            class="ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold"
            :class="data.profile.available_for_work ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
          >
            {{ data.profile.available_for_work ? 'Open to work' : 'Not looking' }}
          </span>
        </div>
      </section>

      <section class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <article
          v-for="stat in counts"
          :key="stat.label"
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p :class="['text-3xl font-bold', stat.accent]">{{ stat.value }}</p>
          <p class="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{{ stat.label }}</p>
        </article>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Recent messages</h2>
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th class="px-4 py-2.5">From</th>
                <th class="px-4 py-2.5">Subject</th>
                <th class="px-4 py-2.5">Received</th>
                <th class="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="!data.recent_messages?.length">
                <td colspan="4" class="px-4 py-6 text-center text-slate-500">No messages yet.</td>
              </tr>
              <tr v-for="message in data.recent_messages" :key="message.id">
                <td class="px-4 py-3">
                  <span class="font-medium text-slate-900">{{ message.name }}</span>
                  <span class="block text-xs text-slate-400">{{ message.email }}</span>
                </td>
                <td class="max-w-[16rem] truncate px-4 py-3 text-slate-600">{{ message.subject || '—' }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-slate-500">{{ fmtDate(message.created_at) }}</td>
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="message.read_at ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-700'"
                  >
                    {{ message.read_at ? 'Read' : 'Unread' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
