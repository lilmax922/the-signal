<script setup lang="ts">
import type { SignalFeed } from '#shared/validators/signal'
import { useDebounceFn } from '@vueuse/core'
import { signalSearchSchema } from '#shared/validators/signal'

const emit = defineEmits<{ select: [] }>()

const router = useRouter()
const route = useRoute()

const searchTerm = ref('')
const isLoading = ref(false)

const mockSignals: SignalFeed[] = [
  {
    id: '1',
    slug: 'nvda-earnings-20260605',
    category: 'finance',
    titleEn: 'NVIDIA Earnings Surpass Expectations',
    titleZh: '輝達財報超預期，AI 需求持續推動成長',
    summaryZh: ['營收年增 69%', '資料中心業務創歷史新高', 'CEO 黃仁勋看好下半年成長'],
    imageUrl: null,
    publishedAt: '2026-06-05T08:00:00.000Z',
    tags: [{ id: 't1', name: 'NVDA' }, { id: 't2', name: 'AI' }],
  },
  {
    id: '2',
    slug: 'apple-ai-strategy-20260605',
    category: 'tech',
    titleEn: 'Apple Expands On-Device AI Capabilities',
    titleZh: '蘋果擴大裝置端 AI 功能，搶占智慧手機市場',
    summaryZh: ['Siri 將搭載大型語言模型', 'iOS 20 新增 AI 摘要功能', '隱私保護成為核心差異化優勢'],
    imageUrl: null,
    publishedAt: '2026-06-05T07:30:00.000Z',
    tags: [{ id: 't3', name: 'AAPL' }, { id: 't4', name: 'LLM' }],
  },
  {
    id: '3',
    slug: 'global-semiconductor-shortage-20260604',
    category: 'world',
    titleEn: 'Global Semiconductor Supply Chain Faces New Pressures',
    titleZh: '全球半導體供應鏈面臨新壓力，地緣政治風險升溫',
    summaryZh: ['東南亞產能受限', '各國加速晶片在地化生產', '交貨週期延長至 18 週'],
    imageUrl: null,
    publishedAt: '2026-06-04T12:00:00.000Z',
    tags: [{ id: 't5', name: 'SEMICONDUCTOR' }, { id: 't6', name: 'SUPPLY-CHAIN' }],
  },
]

const filteredSignals = computed(() => {
  if (!searchTerm.value)
    return []
  const q = searchTerm.value.toLowerCase()
  return mockSignals.filter(s =>
    s.titleZh.toLowerCase().includes(q)
    || s.titleEn.toLowerCase().includes(q)
    || s.tags.some(t => t.name.toLowerCase().includes(q))
    || s.category.toLowerCase().includes(q),
  )
})

const groups = computed(() => {
  const byCategory = new Map<string, SignalFeed[]>()
  for (const s of filteredSignals.value) {
    const list = byCategory.get(s.category) ?? []
    list.push(s)
    byCategory.set(s.category, list)
  }
  return [...byCategory.entries()].map(([cat, signals]) => ({
    id: cat,
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    ignoreFilter: true,
    items: signals.map(s => ({
      ...s,
      label: s.titleZh,
      onSelect: () => {
        router.push({ query: { ...route.query, signal: s.slug } })
        emit('select')
      },
    })),
  }))
})

const hasResults = computed(() => filteredSignals.value.length > 0)

const debouncedSearch = useDebounceFn(() => {
  isLoading.value = false
}, 300)

watch(searchTerm, (val) => {
  const parsed = signalSearchSchema.safeParse({ q: val })
  if (!parsed.success || !val) {
    isLoading.value = false
    return
  }
  isLoading.value = true
  debouncedSearch()
})
</script>

<template>
  <UCommandPalette
    v-model:search-term="searchTerm"
    :groups="groups"
    :loading="isLoading"
    placeholder="搜尋訊號…"
    class="flex-1"
  >
    <template #item="{ item }">
      <div class="flex flex-col gap-1.5 min-w-0">
        <span class="truncate text-default">{{ item.label }}</span>
        <div v-if="(item as any).tags?.length" class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="tag in (item as any).tags"
            :key="tag.id"
            :label="tag.name"
            color="primary"
            variant="soft"
            size="sm"
            class="font-mono uppercase"
          />
        </div>
      </div>
    </template>

    <template #empty>
      <div v-if="searchTerm && !hasResults && !isLoading" class="text-center text-muted py-4">
        找不到符合「{{ searchTerm }}」的結果
      </div>
      <div v-else-if="!searchTerm" class="text-center text-muted py-4">
        輸入關鍵字搜尋訊號
      </div>
    </template>
  </UCommandPalette>
</template>
