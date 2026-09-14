<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../../api/http'
import BasePagination from '../../components/BasePagination.vue'
import { fmtDate } from '../../utils/format'

const loading = ref(true)
const error = ref('')
const messages = ref([])
const stats = ref({ total: 0, unread: 0 })
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const unreadOnly = ref(false)
const page = ref(1)
const expandedId = ref(null)


async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = { page: page.value }
    if (unreadOnly.value) params.unread = 1

    const res = await http.get('/admin/messages', { params })
    messages.value = res.data ?? []
    pagination.value =
      res.meta?.pagination ?? { current_page: 1, last_page: 1, total: messages.value.length }

    const statRes = await http.get('/admin/messages/stats')
    stats.value = statRes.data ?? { total: 0, unread: 0 }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function toggleReadFilter() {
  unreadOnly.value = !unreadOnly.value
  page.value = 1
  load()
}

function toggleExpand(message) {
  expandedId.value = expandedId.value === message.id ? null : message.id
  // Auto-mark as read on first open.
  if (!message.read_at) markRead(message)
}

async function markRead(message) {
  try {
    const res = await http.post(`/admin/messages/${message.id}/read`)
    Object.assign(message, res.data ?? {})
    stats.value = { ...stats.value, unread: Math.max(0, Number(stats.value.unread) - 1) }
  } catch (e) {
    error.value = e.message
  }
}

async function removeMessage(message) {
  if (!window.confirm(`Delete the message from “${message.name}”?`)) return
  try {
    await http.delete(`/admin/messages/${message.id}`)
    if (expandedId.value === message.id) expandedId.value = null
    await load()
  } catch (e) {
    error.value = e.message
  }
}

function goTo(n) {
  if (n < 1 || n > pagination.value.last_page) return
  page.value = n
  load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-bold tracking-tight text-slate-900">Messages</h1>
    <p class="text-sm text-slate-500">{{ pagination.total }} total · {{ stats.unread }} unread.</p>
  </div>
  <button
    type="button"
    class="rounded-md px-4 py-2 text-sm font-semibold"
    :class="unreadOnly ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'"
    @click="toggleReadFilter"
  >
    {{ unreadOnly ? 'Showing unread only' : 'Show unread only' }}
  </button>
</header>

<div v-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

<p v-if="loading" class="text-sm text-slate-500">Loading inbox…</p>
    <p v-else-if="!messages.length" class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
  Inbox zero — nice!
</p>

<template v-else>
  <ul class="space-y-3">
    <li
      v-for="message in messages"
      :key="message.id"
      class="rounded-xl border bg-white shadow-sm"
      :class="message.read_at ? 'border-slate-200' : 'border-brand-300'"
    >
      <button type="button" class="flex w-full items-center gap-3 p-4 text-left" @click="toggleExpand(message)">
        <span :class="message.read_at ? 'text-transparent' : 'font-bold text-brand-600'">●</span>
        <span class="min-w-0 flex-1">
          <span class="font-medium text-slate-900">{{ message.name }}</span>
          <span class="ml-2 text-sm text-slate-400">{{ message.email }}</span>
          <span v-if="message.subject" class="block truncate text-sm text-slate-600">{{ message.subject }}</span>
        </span>
        <time class="whitespace-nowrap text-xs text-slate-400">{{ fmtDate(message.created_at, { datetime: true }) }}</time>
      </button>

      <dl v-if="expandedId === message.id" class="space-y-3 border-t border-slate-100 p-4 text-sm">
        <div v-if="message.subject">
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</dt>
          <dd class="mt-0.5 text-slate-800">{{ message.subject }}</dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">Message</dt>
          <dd class="mt-0.5 whitespace-pre-line text-slate-800">{{ message.message }}</dd>
        </div>
        <div v-if="message.phone">
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</dt>
          <dd class="mt-0.5 text-slate-800">{{ message.phone }}</dd>
        </div>
        <div v-if="message.ip">
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">IP · Device</dt>
          <dd class="mt-0.5 text-xs text-slate-500">{{ message.ip }} — {{ message.device || 'unknown' }}</dd>
        </div>

        <div class="flex gap-3 pt-1">
          <button
            v-if="!message.read_at"
            type="button"
            class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
            @click.stop="markRead(message)"
          >
            Mark as read
          </button>
          <button
            type="button"
            class="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            @click.stop="removeMessage(message)"
          >
            Delete
          </button>
        </div>
      </dl>
    </li>
  </ul>

  <BasePagination :current-page="pagination.current_page" :last-page="pagination.last_page" @change="goTo" />
</template>
  </div>
</template>
