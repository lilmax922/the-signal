import { defineConfig } from '@trigger.dev/sdk'

export default defineConfig({
  // eslint-disable-next-line node/no-process-env
  project: process.env.TRIGGER_PROJECT_REF!,
  runtime: 'node',
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
})
