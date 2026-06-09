<script setup lang="ts">
</script>

<template>
  <div class="p-8 space-y-6">
    <header class="flex justify-between items-start gap-3">
      <div class="flex items-center gap-3">
        <USkeleton class="h-5 w-16 rounded" />
        <USkeleton class="h-4 w-20" />
      </div>
      <USkeleton class="h-8 w-8 rounded" />
    </header>

    <USkeleton class="aspect-video w-full rounded-2xl" />

    <div class="space-y-2">
      <USkeleton class="h-7 w-3/4" />
      <USkeleton class="h-7 w-1/2" />
    </div>

    <div class="flex gap-2">
      <USkeleton class="h-5 w-14 rounded" />
      <USkeleton class="h-5 w-10 rounded" />
      <USkeleton class="h-5 w-12 rounded" />
    </div>

    <div class="space-y-2">
      <div class="flex gap-3">
        <USkeleton class="h-5 w-5 shrink-0" />
        <USkeleton class="h-5 w-full" />
      </div>
      <div class="flex gap-3">
        <USkeleton class="h-5 w-5 shrink-0" />
        <USkeleton class="h-5 w-5/6" />
      </div>
      <div class="flex gap-3">
        <USkeleton class="h-5 w-5 shrink-0" />
        <USkeleton class="h-5 w-2/3" />
      </div>
    </div>

    <div class="space-y-3">
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-5/6" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-3/4" />
    </div>

    <USkeleton class="h-px w-full" />

    <div class="flex items-center gap-2">
      <USkeleton class="h-4 w-4 rounded" />
      <USkeleton class="h-4 w-32" />
    </div>
  </div>
</template>
