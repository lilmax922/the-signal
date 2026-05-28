import './shared/env'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/supabase'],

  devtools: {
    enabled: true,
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
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  routeRules: {
    '/': { prerender: true },
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      standalone: false,
    },
  },
})
