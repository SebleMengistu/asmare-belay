<script setup>
defineProps({
  currentPage: { type: Number, required: true },
  lastPage: { type: Number, required: true },
})

defineEmits(['change'])
</script>

<template>
  <nav v-if="lastPage > 1" class="mt-8 flex items-center justify-center gap-2">
    <button
      class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-40"
      :disabled="currentPage <= 1"
      @click="$emit('change', currentPage - 1)"
    >
      Prev
    </button>

    <button
      v-for="n in lastPage"
      :key="n"
      class="min-w-[2rem] rounded-md border px-2 py-1.5 text-sm font-medium"
      :class="
        n === currentPage
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-slate-300 bg-white hover:bg-slate-100'
      "
      @click="$emit('change', n)"
    >
      {{ n }}
    </button>

    <button
      class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-40"
      :disabled="currentPage >= lastPage"
      @click="$emit('change', currentPage + 1)"
    >
      Next
    </button>
  </nav>
</template>
