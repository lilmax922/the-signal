<script setup lang="ts">
</script>

<template>
  <div class="bg-elevated/40 border border-default rounded-2xl overflow-hidden">
    <USkeleton class="aspect-video w-full rounded-t-2xl" />
    <div class="px-6 py-5 space-y-3">
      <div class="flex items-center gap-2">
        <USkeleton class="h-5 w-16 rounded" />
        <USkeleton class="h-4 w-20" />
      </div>
      <USkeleton class="h-6 w-3/4" />
      <USkeleton class="h-6 w-1/2" />
      <div class="space-y-2 pt-1">
        <div class="flex gap-3">
          <USkeleton class="h-4 w-5 shrink-0" />
          <USkeleton class="h-4 w-full" />
        </div>
        <div class="flex gap-3">
          <USkeleton class="h-4 w-5 shrink-0" />
          <USkeleton class="h-4 w-5/6" />
        </div>
        <div class="flex gap-3">
          <USkeleton class="h-4 w-5 shrink-0" />
          <USkeleton class="h-4 w-2/3" />
        </div>
      </div>
      <div class="flex gap-2 pt-2">
        <USkeleton class="h-5 w-14 rounded" />
        <USkeleton class="h-5 w-10 rounded" />
        <USkeleton class="h-5 w-12 rounded" />
      </div>
    </div>
  </div>
</template>
