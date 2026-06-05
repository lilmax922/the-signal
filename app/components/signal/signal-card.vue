<script setup lang="ts">
import type { SignalFeed } from '#shared/validators/signal'

defineProps<{ signal: SignalFeed }>()

const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})
</script>

<template>
  <article class="bg-elevated/40 border border-default rounded-2xl overflow-hidden">
    <img
      v-if="signal.imageUrl"
      :src="signal.imageUrl"
      :alt="signal.titleZh"
      class="aspect-video w-full object-cover rounded-t-2xl"
      loading="lazy"
    >
    <div class="px-6 py-5 space-y-3">
      <div class="flex items-center gap-2 text-xs font-mono text-muted">
        <span class="uppercase px-1.5 py-0.5 border border-default rounded">
          {{ signal.category }}
        </span>
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
        <span
          v-for="tag in signal.tags"
          :key="tag.id"
          class="text-xs font-mono uppercase tracking-wide"
        >
          {{ tag.name }}
        </span>
      </div>
    </div>
  </article>
</template>
