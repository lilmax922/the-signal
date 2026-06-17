<script setup lang="ts">
const categories = [
  { label: '全部', slug: null },
  { label: '科技', slug: 'tech' },
  { label: '股市', slug: 'finance' },
  { label: '國際', slug: 'world' },
] as const

const currentCategory = useCurrentCategory()
const selected = computed(() => {
  const match = categories.find(c => c.slug === currentCategory.value)
  return match?.slug ?? null
})

const tabRefs = ref<Array<HTMLButtonElement | null>>([])

function setTabRef(idx: number) {
  return (el: Element | null) => {
    if (el instanceof HTMLButtonElement)
      tabRefs.value[idx] = el
    else
      tabRefs.value[idx] = null
  }
}

watch(currentCategory, async () => {
  await nextTick()
  const idx = categories.findIndex(c => c.slug === selected.value)
  tabRefs.value[idx]?.focus({ preventScroll: true })
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
        v-for="(category, idx) in categories"
        :ref="setTabRef(idx)"
        :key="category.label"
        type="button"
        class="relative shrink-0 text-xs lg:text-sm font-medium transition-colors duration-200 py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        :class="selected === category.slug ? 'text-primary' : 'text-muted hover:text-default'"
        @click="onSelect(category.slug)"
      >
        {{ category.label }}
        <span
          v-if="selected === category.slug"
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
