<script setup lang="ts">
import type { Signal } from '#shared/validators/signal'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

const { data: signal, status } = await useFetch<Signal>(
  () => `/api/signals/${slug.value}`,
  { key: () => `signal-direct-${slug.value}` },
)

const isLoading = computed(() => status.value === 'pending' && !signal.value)
const hasError = computed(() => status.value === 'error' && !signal.value)

useHead({
  title: computed(() => signal.value ? `${signal.value.titleZh} — The Signal` : 'The Signal'),
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <div
      v-if="isLoading"
      class="p-8 text-sm font-mono text-muted"
    >
      載入中…
    </div>
    <div
      v-else-if="hasError"
      class="p-8 text-sm font-mono text-muted"
    >
      載入失敗
    </div>
    <SignalDetail
      v-else-if="signal"
      :signal="signal"
      @close="navigateTo('/')"
    />
  </div>
</template>
