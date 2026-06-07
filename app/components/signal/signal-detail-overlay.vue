<script setup lang="ts">
import type { Signal } from '#shared/validators/signal'
import { useMediaQuery } from '@vueuse/core'

const props = defineProps<{ slug: string }>()

const route = useRoute()
const router = useRouter()
const isDesktop = useMediaQuery('(min-width: 1024px)')

const { data: signal, status } = await useAsyncData<Signal>(
  `signal-overlay-${props.slug}`,
  () => $fetch<Signal>(`/api/signals/${props.slug}`),
  { watch: [() => props.slug] },
)

const isLoading = computed(() => status.value === 'pending' && !signal.value)
const hasError = computed(() => status.value === 'error' && !signal.value)

const isOpen = ref(false)

nextTick(() => {
  isOpen.value = !!props.slug
})

watch(() => props.slug, (val) => {
  isOpen.value = !!val
})

function removeSignalFromUrl(): void {
  if (route.query.signal) {
    const { signal: _signal, ...rest } = route.query
    router.push({ query: rest })
  }
}

function handleClose(): void {
  isOpen.value = false
}
</script>

<template>
  <USlideover
    v-if="isDesktop"
    v-model:open="isOpen"
    :ui="{ header: 'hidden', body: 'p-0 sm:p-0' }"
    :content="{
      onOpenAutoFocus: (e: Event) => e.preventDefault(),
      onCloseAutoFocus: (e: Event) => e.preventDefault(),
    }"
    @after:leave="removeSignalFromUrl"
  >
    <template #body>
      <div class="h-full overflow-y-auto">
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
          :signal
          @close="handleClose"
        />
      </div>
    </template>
  </USlideover>

  <UDrawer
    v-else
    v-model:open="isOpen"
    :ui="{ header: 'hidden', body: 'p-0' }"
    @animation-end="(open: boolean) => { if (!open) removeSignalFromUrl() }"
  >
    <template #body>
      <div class="h-full overflow-y-auto">
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
          :signal
          @close="handleClose"
        />
      </div>
    </template>
  </UDrawer>
</template>
