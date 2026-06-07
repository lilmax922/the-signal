<script setup lang="ts">
import type { Signal } from '#shared/validators/signal'

defineProps<{ signal: Signal }>()
const emit = defineEmits<{ close: [] }>()

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
</script>

<template>
  <div class="p-8 space-y-6">
    <header class="flex justify-between items-start gap-3">
      <div class="flex items-center gap-3 text-xs font-mono text-muted">
        <span class="uppercase px-1.5 py-0.5 border border-default rounded">
          {{ signal.category }}
        </span>
        <time :datetime="signal.publishedAt">
          {{ dateFormatter.format(new Date(signal.publishedAt)) }}
        </time>
      </div>
      <UButton
        icon="i-lucide-x"
        variant="ghost"
        color="neutral"
        size="sm"
        aria-label="關閉"
        @click="emit('close')"
      />
    </header>

    <img
      v-if="signal.imageUrl"
      :src="signal.imageUrl"
      :alt="signal.titleZh"
      class="aspect-video w-full rounded-2xl object-cover"
      loading="eager"
    >

    <h1 class="text-2xl xl:text-3xl font-medium leading-relaxed text-highlighted">
      {{ signal.titleZh }}
    </h1>

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

    <div
      v-if="signal.tags.length"
      class="flex flex-wrap gap-2 mt-4 text-xs font-mono uppercase tracking-wide"
    >
      <span
        v-for="tag in signal.tags"
        :key="tag.id"
      >
        {{ tag.name }}
      </span>
    </div>

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
