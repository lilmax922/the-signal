import { resolve } from 'node:path'
import { defineConfig } from '@trigger.dev/sdk'

// Nuxt's `#shared` alias is a Nuxt-time path mapping. Trigger.dev's esbuild
// bundler has no knowledge of it, so files under `server/database/*` that use
// `#shared/...` (e.g. `findSignals` in `queries/signal.ts`) fail to resolve
// during the trigger build. This extension registers a tiny esbuild plugin
// that translates `#shared[/...]` to the absolute file path under
// `<root>/shared[/...].ts` at resolve time. esbuild then loads the file
// directly (no extension probing needed because the `shared/` tree is
// TypeScript-only).
//
// Mirror of `nuxt.config.ts`'s `alias` for `#shared` — keep the two in sync.
const nuxtAliasResolver = {
  name: 'nuxt-alias-resolver',
  onBuildStart({ workingDir, registerPlugin }) {
    registerPlugin({
      name: 'nuxt-alias',
      setup(build) {
        build.onResolve({ filter: /^#shared(?:\/|$)/ }, (args) => {
          const suffix = args.path.slice('#shared'.length)
          return { path: resolve(workingDir, `shared${suffix}.ts`) }
        })
      },
    })
  },
}

export default defineConfig({
  // eslint-disable-next-line node/no-process-env
  project: process.env.TRIGGER_PROJECT_REF!,
  runtime: 'node-22',
  dirs: ['trigger'],
  maxDuration: 3600,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
  build: {
    extensions: [nuxtAliasResolver],
  },
})
