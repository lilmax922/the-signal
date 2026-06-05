<script setup lang="ts">
definePageMeta({
  layout: false,
})

const supabase = useSupabaseClient()
const loading = ref(false)
const errorMessage = ref<string | null>(null)

async function signInWithOAuth(provider: 'github' | 'google'): Promise<void> {
  loading.value = true
  errorMessage.value = null

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/confirm`,
    },
  })

  if (error) {
    errorMessage.value = error.message
    loading.value = false
  }
}

const features = [
  {
    icon: 'i-lucide-sparkles',
    title: '情緒過濾',
    description: 'AI 去除情緒化內容與誇大敘述',
  },
  {
    icon: 'i-lucide-layout',
    title: '舒適瀏覽',
    description: '無需跳頁，輕鬆掌握所有資訊',
  },
  {
    icon: 'i-lucide-zap',
    title: '純淨資訊',
    description: '只留事實數據，移除臆測與干擾',
  },
]

const providers = [
  {
    label: 'Google',
    icon: 'i-simple-icons-google',
    onClick: () => signInWithOAuth('google'),
  },
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    onClick: () => signInWithOAuth('github'),
  },
]
</script>

<template>
  <div class="min-h-dvh bg-black flex">
    <!-- Left panel — desktop only -->
    <div class="hidden lg:flex lg:w-1/2 items-center bg-elevated/40 border-r border-default/50">
      <div class="max-w-lg pl-16 pr-12 xl:pl-20 space-y-12">
        <div class="space-y-4">
          <h1 class="text-4xl font-semibold text-highlighted tracking-tight leading-tight">
            The Signal
          </h1>
          <p class="text-base text-muted leading-relaxed">
            客觀資訊，精準事實。AI 自動過濾新聞中的情緒化用語與誇大標題，還原核心內容。
          </p>
        </div>

        <div class="space-y-6">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="flex items-start gap-4"
          >
            <div class="size-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
              <UIcon :name="feature.icon" class="size-5 text-primary" />
            </div>
            <div>
              <h3 class="text-base font-medium text-highlighted">
                {{ feature.title }}
              </h3>
              <p class="text-sm text-muted">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right panel — login form -->
    <div class="flex-1 flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-sm lg:max-w-md">
        <div class="relative">
          <!-- Decorative background elements -->
          <div class="absolute inset-0 -z-10">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 rounded-full bg-primary/5 blur-3xl" />
            <div class="absolute top-8 right-8 size-32 rounded-full bg-primary/3 blur-2xl" />
          </div>

          <UPageCard
            variant="outline"
            class="relative overflow-hidden"
            :ui="{
              root: 'w-full backdrop-blur-sm',
            }"
          >
            <UAuthForm
              title="登入 The Signal"
              description="歡迎回來！請登入以繼續使用。"
              :providers="providers"
            >
              <template #footer>
                <p v-if="errorMessage" class="text-sm text-error text-center">
                  {{ errorMessage }}
                </p>
              </template>
            </UAuthForm>
          </UPageCard>
        </div>
      </div>
    </div>
  </div>
</template>
