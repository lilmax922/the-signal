import env from './shared/env'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/supabase', '@nuxt/image'],

  // DEV-AUTH-DISABLED: 關閉 @nuxtjs/supabase 模組內建的 auth-redirect 全域中介層。
  // 該中介層 (dist/runtime/plugins/auth-redirect.js) 會在未登入時自動 navigateTo('/login'),
  // 優先於 app/middleware/auth.global.ts 執行,即使後者被註解也仍會觸發。
  // 重新啟用:移除下一行,並一併還原 auth.global.ts / login.vue / 各 useFetch onResponseError /
  // serverSupabaseUser 區塊(全專案共 8 處 DEV-AUTH-DISABLED 標記)。
  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/callback',
      exclude: ['/api/cron/**'],
    },
  },

  devtools: {
    enabled: true,
  },

  experimental: {
    payloadExtraction: true,
  },

  imports: {
    dirs: ['shared/env.ts'],
  },

  nitro: {
    experimental: {
      tasks: true,
    },
    imports: {
      dirs: ['shared/env.ts'],
    },
    scheduledTasks: {
      '0 8,20 * * *': ['rss-ingestion'], // 08:00 and 20:00 daily
    },
    routeRules: {
      'api/signals/**': { cache: { maxAge: 60 * 60 * 24 * 30 } },
    },
    vercel: {
      config: {
        crons: [
          {
            path: '/api/cron/rss-ingestion',
            schedule: '0 8,20 * * *',
          },
        ],
      },
    },
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      standalone: false,
    },
  },

  image: {
    // @ts-expect-error nuxt-image providers issue (https://github.com/nuxt/image/pull/2141)
    supabase: {
      baseURL: `${env.NUXT_PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/signal-images`,
    },
  },
})
