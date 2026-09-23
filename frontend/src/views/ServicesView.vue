<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Services',
  description: 'Hydrological modeling, GIS & remote sensing analysis, flood and drought studies, training and water resources consulting.',
})

const loading = ref(true)
const error = ref('')
const services = ref([])

const priceOf = (service) =>
  service.price_from !== null && service.price_from !== undefined
    ? `${service.currency || 'USD'} ${Number(service.price_from).toLocaleString()}`
    : ''

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/services')
    services.value = res.data ?? []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Services</h1>
      <p class="text-sm text-slate-500">How I can help your team ship faster.</p>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Loading services…</p>
    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>
    <p v-else-if="!services.length" class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
      No services published yet.
    </p>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="service in services"
        :key="service.id"
        class="card card-hover flex flex-col p-6"
      >
        <h2 class="font-semibold text-slate-900">{{ service.title }}</h2>

        <p v-if="priceOf(service)" class="mt-1 text-sm font-semibold text-gradient">
          From {{ priceOf(service) }}
          <span v-if="service.delivery" class="ml-1 font-normal text-slate-500">· {{ service.delivery }}</span>
        </p>

        <p v-if="service.summary" class="mt-2 text-sm text-slate-600">{{ service.summary }}</p>

        <ul v-if="service.features?.length" class="mt-4 space-y-1.5 text-sm text-slate-600">
          <li v-for="(feature, i) in service.features" :key="i" class="flex gap-2">
            <span class="text-emerald-500">✓</span>
            <span>{{ feature }}</span>
          </li>
        </ul>

        <div class="mt-auto pt-6">
          <RouterLink
            to="/contact"
            class="btn-primary"
          >
            {{ service.cta_label || 'Request this service' }}
          </RouterLink>
        </div>
      </article>
    </div>
  </div>
</template>
