<script setup lang="ts">
import { useScrollCollapse } from '~/composables/use-scroll-collapse'

// DEV-AUTH-DISABLED: Supabase user/client 與 dropdown menu 已停用。
// 重新啟用:取消下方 /* … */ 區塊的註解,並還原 <template> 中的 UDropdownMenu。
/*
// DEV-AUTH-DISABLED: see header comment above
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const avatarUrl = computed(() => user.value?.user_metadata?.avatar_url || '')
const userEmail = computed(() => user.value?.email || '')

const userMenuItems = computed(() => [
  [
    {
      label: userEmail.value || 'User',
      type: 'label' as const,
    },
  ],
  [
    {
      label: '收藏',
      icon: 'i-lucide:bookmark',
    },
    {
      label: '設定',
      icon: 'i-lucide:settings',
    },
  ],
  [
    {
      label: '登出',
      icon: 'i-lucide:log-out',
      color: 'error' as const,
      onSelect: async () => {
        await supabase.auth.signOut()
        navigateTo('/login')
      },
    },
  ],
])
*/

const isSearchOpen = ref(false)

defineShortcuts({
  meta_k: () => { isSearchOpen.value = true },
})

const { isCollapsed: isMobileHeaderCollapsed } = useScrollCollapse({ threshold: 10, minScrollY: 60 })
</script>

<template>
  <header
    class="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-md border-b border-default"
  >
    <div class="h-16 px-4 lg:px-6 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 justify-center lg:justify-normal">
        <span class="text-base lg:text-lg font-semibold text-highlighted">The Signal</span>
      </div>

      <div class="hidden lg:flex flex-1 max-w-xl justify-center">
        <UButton
          icon="i-lucide:search"
          label="搜尋訊號…"
          variant="outline"
          color="neutral"
          class="w-full max-w-md justify-between"
          @click="isSearchOpen = true"
        >
          <UKbd size="sm" class="ms-auto">
            <span class="text-xs">⌘K</span>
          </UKbd>
        </UButton>
      </div>

      <!-- DEV-AUTH-DISABLED: 原本的 UDropdownMenu + 頭像已替換為 disabled 佔位按鈕,維持 header 寬度。 -->
      <div class="flex items-center">
        <UButton
          variant="ghost"
          color="neutral"
          disabled
          aria-label="登入功能已停用"
        >
          <UAvatar icon="i-lucide:user" size="sm" />
        </UButton>
      </div>
    </div>

    <div
      class="lg:hidden overflow-hidden border-t border-default transition-all duration-300 ease-out"
      :class="isMobileHeaderCollapsed ? 'max-h-0' : 'max-h-30'"
    >
      <div class="px-4 pt-3">
        <UButton
          icon="i-lucide:search"
          label="搜尋訊號…"
          variant="outline"
          color="neutral"
          class="w-full justify-between"
          @click="isSearchOpen = true"
        >
          <UKbd size="sm" class="ms-auto hidden lg:inline-flex">
            <span class="text-xs">⌘K</span>
          </UKbd>
        </UButton>
      </div>
      <div class="px-4 pb-3">
        <CategoryFilter />
      </div>
    </div>
  </header>

  <div
    class="lg:hidden transition-[height] duration-300 ease-out"
    :class="isMobileHeaderCollapsed ? 'h-16' : 'h-46'"
  />

  <ResponsiveModal
    v-model:open="isSearchOpen"
    :modal-ui="{ content: 'max-w-xl' }"
    :drawer-ui="{ content: 'h-1/2' }"
  >
    <SearchCommandPalette @select="isSearchOpen = false" />
  </ResponsiveModal>
</template>
