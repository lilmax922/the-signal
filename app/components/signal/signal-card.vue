<script setup lang="ts">
import type { Category, SignalFeed } from '#shared/validators/signal'

defineProps<{
  signal: SignalFeed
  category?: Category
}>()

const router = useRouter()
const route = useRoute()

const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

function navigate(slug: string): void {
  router.push({ query: { ...route.query, signal: slug } })
}
</script>

<template>
  <NuxtLink
    class="bg-elevated/40 border border-default rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    tabindex="0"
    @click="navigate(signal.slug)"
    @keydown.enter="navigate(signal.slug)"
  >
    <div
      v-if="signal.imageUrl"
      class="aspect-video w-full rounded-t-2xl overflow-hidden bg-elevated/40"
    >
      <NuxtImg
        :src="signal.imageUrl"
        :alt="signal.titleZh"
        class="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
    <div class="px-6 py-5 space-y-3">
      <div class="flex items-center gap-2 text-xs font-mono text-muted">
        <UBadge
          :label="signal.category"
          color="neutral"
          variant="outline"
          size="sm"
          class="uppercase"
        />
        <time :datetime="signal.publishedAt">
          {{ dateFormatter.format(new Date(signal.publishedAt)) }}
        </time>
      </div>
      <h2 class="text-xl font-medium leading-relaxed text-highlighted">
        {{ signal.titleZh }}
      </h2>
      <ul class="text-sm font-light leading-relaxed text-default space-y-2">
        <li
          v-for="(point, idx) in signal.summaryZh"
          :key="idx"
          class="flex gap-3"
        >
          <span class="font-mono text-muted shrink-0">{{ String(idx + 1).padStart(2, '0') }}</span>
          <span class="tracking-wide">{{ point }}</span>
        </li>
      </ul>
      <div
        v-if="signal.tags.length"
        class="flex flex-wrap gap-2 mt-4"
      >
        <UBadge
          v-for="tag in signal.tags"
          :key="tag.id"
          :label="tag.name"
          color="primary"
          variant="soft"
          size="sm"
          class="font-mono uppercase"
        />
      </div>
    </div>
  </NuxtLink>
</template>
