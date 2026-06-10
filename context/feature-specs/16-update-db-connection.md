# Objective

Because we are deployed in a serverless environment (Vercel), we need to use supabase `transaction pooler` connection, but some migration operations (such as CREATE INDEX CONCURRENTLY) require persistent session connections and must be executed with direct URL

# Step 1 - Update .env, .evn.example

- Update DATABASE_URL with transaction pooler connection string.
- Add DATABASE_URL_DIRECT with direct connection string.

# Step 2 - Validate DATABASE_URL_DIRECT

- Add DATABASE_URL_DIRECT to `shared/env.ts` to verify that env var are set.

# Step 3 - Update Drizzle config and client db url

- Update `dizzle.config.ts` dbCredentials url with `DATABASE_URL_DIRECT`.
- Update `server/database/index.ts` to ensure `prepare` is disabled, as the transaction pooler does not support prepared statements.
- Update `server/database/index.ts`  to remove `max: 1` to avoid harming concurrency in Fluid Compute.

# Out of Scope

- Modify DB schema.
- Modify migrations.

# Check When Done

- Set direct connection to drizzle config.
- Prepare statements is disabled.
- Max pool size is removed.