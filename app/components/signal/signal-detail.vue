<script setup lang="ts">
import type { Signal } from '#shared/validators/signal'

const { signal } = defineProps<{ signal: Signal }>()
const emit = defineEmits<{ close: [] }>()

const url = useRequestURL()
const toast = useToast()

const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

function sourceHostname(url: string): string {
  try {
    return new URL(url).hostname
  }
  catch {
    return url
  }
}

async function copyLink(): Promise<void> {
  try {
    const link = new URL(`/signal/${signal.slug}`, url.origin)
    await navigator.clipboard.writeText(link.href)
    toast.add({ title: '連結已複製', color: 'success' })
  }
  catch (e) {
    console.error(e)
    toast.add({ title: '複製失敗，請稍後再試', color: 'error' })
  }
}
</script>

<template>
  <div class="p-8 space-y-6">
    <header class="flex justify-between items-center gap-3">
      <div class="flex items-center gap-3 text-xs font-mono text-muted">
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
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-link"
          variant="ghost"
          color="neutral"
          size="sm"
          aria-label="複製連結"
          @click="copyLink"
        />
        <UButton
          icon="i-lucide-x"
          variant="ghost"
          color="neutral"
          size="sm"
          aria-label="關閉"
          @click="emit('close')"
        />
      </div>
    </header>

    <div
      v-if="signal.imageUrl"
      class="aspect-video w-full rounded-2xl overflow-hidden bg-elevated/40"
    >
      <NuxtImg
        :src="signal.imageUrl"
        :alt="signal.titleZh"
        class="w-full h-full object-cover"
        loading="eager"
      />
    </div>

    <h1 class="text-2xl xl:text-3xl font-medium leading-relaxed text-highlighted">
      {{ signal.titleZh }}
    </h1>

    <div
      v-if="signal.tags.length"
      class="flex flex-wrap gap-2"
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

    <ul class="space-y-2">
      <li
        v-for="(point, idx) in signal.summaryZh"
        :key="idx"
        class="flex gap-3"
      >
        <span class="font-mono text-muted text-base shrink-0">{{ String(idx + 1).padStart(2, '0') }}</span>
        <span class="text-base tracking-wide">{{ point }}</span>
      </li>
    </ul>

    <div class="text-base font-light leading-relaxed tracking-wide whitespace-pre-line text-default">
      {{ signal.contentZh }}
    </div>

    <USeparator />

    <a
      :href="signal.sourceUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 text-sm font-mono text-muted hover:text-highlighted transition-colors"
    >
      <UIcon
        name="i-lucide-external-link"
        class="size-4"
      />
      {{ sourceHostname(signal.sourceUrl) }}
    </a>
  </div>
</template>
