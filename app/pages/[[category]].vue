<script setup lang="ts">
import type { Category, FeedResponse, SignalFeed } from '#shared/validators/signal'
import { categorySchema } from '#shared/validators/signal'

const route = useRoute()

const category = computed<Category | undefined>(() => {
  const c = route.params.category
  if (c === undefined || c === '')
    return undefined
  if (typeof c !== 'string') {
    throw createError({
      statusCode: 404,
      statusMessage: 'invalid category',
    })
  }
  const parsed = categorySchema.safeParse(c)
  if (!parsed.success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'invalid category',
    })
  }
  return parsed.data
})

const feedKey = computed(() => `signal-feed-${category.value ?? 'all'}`)

const { data, status, refresh } = await useFetch<FeedResponse>('/api/signals', {
  key: feedKey,
  query: computed(() => ({ category: category.value })),
  onResponseError({ response }) {
    if (response.status === 401) {
      navigateTo('/login')
    }
  },
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
      }"
      @load-more="loadMore"
      @retry="() => refresh()"
    />
  </div>
</template>
