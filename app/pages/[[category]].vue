<script setup lang="ts">
import type { Category, FeedResponse, SignalFeed } from '#shared/validators/signal'
import { categorySchema } from '#shared/validators/signal'

const route = useRoute()

const category = computed<Category | undefined>(() => {
  const c = route.params.category
  const candidate = typeof c === 'string' && c !== ''
    ? c
    : (typeof route.params.slug === 'string' ? route.params.slug : undefined)
  if (candidate === undefined || candidate === '')
    return undefined
  const parsed = categorySchema.safeParse(candidate)
  if (!parsed.success) {
    return undefined
  }
  return parsed.data
})

const feedKey = computed(() => `signal-feed-${category.value ?? 'all'}`)

const { data, status, refresh } = await useFetch<FeedResponse>('/api/signals', {
  key: feedKey,
  query: computed(() => ({ category: category.value })),
  // DEV-AUTH-DISABLED: 401 自動跳轉已停用,改為單純忽略錯誤。
  // 重新啟用:取消下方 /* … */ 區塊的註解。
  /*
  onResponseError({ response }) {
    if (response.status === 401) {
      navigateTo('/login')
    }
  },
  */
})

const items = ref<SignalFeed[]>([])
const cursor = ref<string | null>(null)
const hasMore = ref(false)
const isLoadingMore = ref(false)

watch(
  data,
  (newData) => {
    if (!newData) {
      items.value = []
      cursor.value = null
      hasMore.value = false
      return
    }
    items.value = [...newData.items]
    cursor.value = newData.nextCursor
    hasMore.value = newData.hasMore
  },
  { immediate: true },
)

async function loadMore(): Promise<void> {
  if (!hasMore.value || isLoadingMore.value || !cursor.value)
    return
  isLoadingMore.value = true
  try {
    const next = await $fetch<FeedResponse>('/api/signals', {
      query: { category: category.value, cursor: cursor.value },
    })
    items.value.push(...next.items)
    cursor.value = next.nextCursor
    hasMore.value = next.hasMore
  }
  finally {
    isLoadingMore.value = false
  }
}

const isLoading = computed(() => status.value === 'pending')
const hasError = computed(() => status.value === 'error')

const activeSlug = computed(() => {
  const s = route.query.signal
  return typeof s === 'string' && s !== '' ? s : null
})
</script>

<template>
  <div class="pt-6 lg:pt-6">
    <SignalFeed
      v-bind="{
        items,
        isLoading,
        isLoadingMore,
        hasMore,
        error: hasError,
        category,
      }"
      @load-more="loadMore"
      @retry="() => refresh()"
    />

    <SignalDetailOverlay
      v-if="activeSlug"
      :slug="activeSlug"
    />
  </div>
</template>
