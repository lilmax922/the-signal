<script setup lang="ts">
import type { Signal } from '#shared/validators/signal'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

const { data: signal, status } = await useFetch<Signal>(
  () => `/api/signals/${slug.value}`,
  { key: () => `signal-direct-${slug.value}` },
)

const signalMeta = computed<Signal | null>(() => signal.value ?? null)
useSignalMeta(signalMeta)

const isLoading = computed(() => status.value === 'pending' && !signal.value)
const hasError = computed(() => status.value === 'error' && !signal.value)
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <SignalDetailSkeleton
      v-if="isLoading"
    />
    <div
      v-else-if="hasError"
      class="p-8"
    >
      <UEmpty
        icon="i-lucide-alert-circle"
        title="載入失敗"
        description="無法取得訊號資料，請稍後再試。"
        :actions="[
          {
            label: '返回首頁',
            color: 'neutral',
            variant: 'outline',
            icon: 'i-lucide-arrow-left',
            onClick: () => { void navigateTo('/') },
          },
        ]"
      />
    </div>
    <SignalDetail
      v-else-if="signal"
      :signal="signal"
      @close="navigateTo('/')"
    />
  </div>
</template>
