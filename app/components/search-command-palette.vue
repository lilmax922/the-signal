<script setup lang="ts">
const {
  searchTerm,
  isLoading,
  isError,
  hasSearched,
  hasFetched,
  hasResults,
  groups,
} = useSearch()
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
      <div v-if="isLoading" class="px-2 py-1 space-y-3">
        <div
          v-for="i in 4"
          :key="i"
          class="flex flex-col gap-1.5 px-2 py-1.5"
        >
          <USkeleton class="h-4 w-3/4" />
          <div class="flex gap-1.5">
            <USkeleton class="h-4 w-12 rounded" />
            <USkeleton class="h-4 w-16 rounded" />
          </div>
        </div>
      </div>
      <div v-else-if="hasSearched && hasFetched && !hasResults" class="text-center text-muted py-4">
        找不到符合「{{ searchTerm }}」的結果
      </div>
      <div v-else-if="isError" class="text-center text-error py-4">
        搜尋時發生錯誤，請稍後再試
      </div>
      <div v-else-if="!hasSearched" class="text-center text-muted py-4">
        輸入關鍵字搜尋訊號
      </div>
    </template>
  </UCommandPalette>
</template>
