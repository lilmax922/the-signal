<script setup lang="ts">
import type { Category, SignalFeed } from '#shared/validators/signal'
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps<{
  items: SignalFeed[]
  isLoading: boolean
  isTransitioning: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: boolean
  category?: Category
}>()

const emit = defineEmits<{
  loadMore: []
  retry: []
}>()

const sentinel = ref<HTMLElement | null>(null)

useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (
      entry?.isIntersecting
      && props.hasMore
      && !props.isLoading
      && !props.isLoadingMore
    ) {
      emit('loadMore')
    }
  },
  { rootMargin: '200px' },
)
</script>

<template>
  <div>
    <!-- Transitioning loading bar — visible when switching categories without cache -->
    <div
      v-if="isTransitioning"
      class="fixed top-0 left-0 right-0 h-0.5 bg-primary/50 animate-pulse z-50"
    />

    <!-- Initial-load skeleton (6 cards fills 2 rows on a 3-col desktop grid) -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 md:px-8 lg:px-12"
    >
      <SignalCardSkeleton
        v-for="i in 6"
        :key="i"
      />
    </div>

    <!-- First-page error (only when we have nothing to show) -->
    <div
      v-else-if="error && items.length === 0"
      class="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-20"
    >
      <UEmpty
        icon="i-lucide-alert-circle"
        title="載入失敗"
        description="無法取得最新訊號，請稍後再試。"
        :actions="[
          {
            label: '重試',
            color: 'neutral',
            variant: 'outline',
            icon: 'i-lucide-refresh-cw',
            onClick: () => emit('retry'),
          },
        ]"
      />
    </div>

    <!-- True empty state (no items at all) -->
    <div
      v-else-if="items.length === 0"
      class="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-20"
    >
      <UEmpty
        icon="i-lucide-inbox"
        title="目前沒有任何訊號"
        description="新訊號將會自動出現在這裡。"
        variant="naked"
      />
    </div>

    <!-- Items grid (with sentinel + load-more spinner + end-of-feed marker) -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10 max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pb-16"
    >
      <SignalCard
        v-for="item in items"
        :key="item.id"
        :signal="item"
        :category="category"
      />

      <!-- IntersectionObserver sentinel — only present while more pages exist -->
      <div
        v-if="hasMore"
        ref="sentinel"
        class="col-span-1 md:col-span-2 xl:col-span-3 h-1"
        aria-hidden="true"
      />

      <!-- Loading-more indicator -->
      <div
        v-if="isLoadingMore"
        class="col-span-1 md:col-span-2 xl:col-span-3 flex items-center justify-center gap-2 py-8 text-xs font-mono uppercase tracking-wide text-muted"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-4 animate-spin"
        />
        載入中
      </div>

      <!-- End-of-feed marker — comfortable bottom breathing room + a quiet
           visual terminus (hairline divider + check + label) so the user
           knows they reached the bottom without a hard "no results" tone. -->
      <div
        v-else-if="!hasMore"
        class="col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center gap-3 pt-8 pb-4"
      >
        <div class="flex items-center w-full max-w-xs">
          <div class="flex-1 h-px bg-default" />
          <UIcon
            name="i-lucide-check"
            class="mx-3 size-3.5 text-muted"
          />
          <div class="flex-1 h-px bg-default" />
        </div>
        <p class="text-xs font-mono uppercase tracking-wide text-muted">
          已顯示全部訊號
        </p>
      </div>
    </div>
  </div>
</template>
