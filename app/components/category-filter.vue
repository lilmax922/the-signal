<script setup lang="ts">
const route = useRoute()

const categories = [
  { label: '全部', slug: null },
  { label: '科技', slug: 'tech' },
  { label: '股市', slug: 'finance' },
  { label: '能源', slug: 'world' },
] as const

const currentCategory = computed<string | null>(() => {
  const c = route.params.category
  if (c === undefined || c === '')
    return null
  return c as string
})

const selected = computed(() => {
  const match = categories.find(c => c.slug === currentCategory.value)
  return match?.label ?? '全部'
})

function onSelect(slug: string | null): void {
  if (slug === null) {
    void navigateTo('/')
    return
  }
  void navigateTo(`/${slug}`)
}
</script>

<template>
  <div class="relative">
    <div class="flex gap-6 overflow-x-auto scrollbar-hide">
      <button
        v-for="category in categories"
        :key="category.label"
        class="relative shrink-0 text-xs lg:text-sm font-medium transition-colors duration-200 py-2"
        :class="selected === category.label ? 'text-primary' : 'text-muted hover:text-default'"
        @click="onSelect(category.slug)"
      >
        {{ category.label }}
        <span
          v-if="selected === category.label"
          class="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
