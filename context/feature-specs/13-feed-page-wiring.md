# Objective

Wire the read-side feed UI to the existing `GET /api/signals` endpoint. Replace the placeholder `app/pages/index.vue` with the master-detail parent route `app/pages/[[category]].vue`, and ship the two components that render the feed grid and individual cards. No custom composable, no Pinia store, no detail modal — those are deferred to follow-up specs.

# Implementation

## Step 1 — Delete placeholder route

Remove `app/pages/index.vue` entirely. The optional dynamic segment `app/pages/[[category]].vue` replaces it (per `code-standards.md:62-66` and `architecture.md:62-63`). The parent route mounts exactly once per browser session (invariant #9) and is the natural home for the feed's reactive state — no external store is needed.

## Step 2 — Create parent route `app/pages/[[category]].vue`

The page owns the feed state directly in its `<script setup>`. No external composable, no Pinia store.

- Read `route.params.category`. Validate against `categorySchema` (from `shared/validators/signal.ts`); on mismatch, `throw createError({ statusCode: 404, statusMessage: 'invalid category' })` per `ui-context.md:81`. The validated value is exposed as a `computed<Category | undefined>()` named `category`.
- Initial fetch via `useFetch<FeedResponse>('/api/signals', { key: computed(() => 'signal-feed-' + (category.value ?? 'all')), query: computed(() => ({ category: category.value })) })` — gives SSR-hydrated first paint and a reactive `refresh()`. The reactive `key` and `query` mean navigating to a different category automatically triggers a refetch with a fresh cache key (the per-category partial index is hit server-side).
- Local refs alongside the fetch:
  - `items: SignalFeed[]` — seeded from the first-page response via a `watch(data, …, { immediate: true })`.
  - `cursor: string | null`, `hasMore: boolean`, `isLoadingMore: boolean`.
- `loadMore()` — guarded by `hasMore && !isLoadingMore && cursor`. Calls `$fetch<FeedResponse>('/api/signals', { query: { category: category.value, cursor: cursor.value } })`. Plain `$fetch` is correct here per `nuxt-getting-started-data-fetching`: it is a client-side event-driven fetch, not initial data.
- 401 handling: `onResponseError` on the `useFetch` call — if `response.status === 401`, `navigateTo('/login')`. The global `auth.global.ts` middleware handles the SSR case before the page mounts; this is the client-side defence.
- Derived props for `<SignalFeed>`: `isLoading = computed(() => status.value === 'pending')`, `hasError = computed(() => status.value === 'error')`, plus a `retry` handler that calls `refresh()`.
- Template: existing `<AppHeader />` (in `app/layouts/default.vue`) + existing `<CategoryFilter />` + `<SignalFeed v-bind="…" @load-more="loadMore" @retry="refresh" />`. No `<NuxtPage />` slot yet — that lands in #14.

## Step 3 — Create `app/components/signal/signal-card.vue`

Props: `{ signal: SignalFeed }`. Import the inferred type from `#shared/validators/signal`; do not redeclare the shape.

Anatomy per `ui-context.md:144-151`:

- Image — `aspect-video`, `rounded-t-2xl`; render only when `signal.imageUrl` is non-null (the API allows null per `architecture.md:154`).
- Row 1 — category badge (uppercase, `text-xs font-mono`, `px-1.5 py-0.5 border border-default rounded`) + `publishedAt` formatted via `Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeZone: 'UTC' })` wrapped in `<time :datetime="signal.publishedAt">`.
- Title — `text-xl font-medium leading-relaxed text-highlighted`, displays `signal.titleZh`.
- 3-point summary — `text-sm font-light leading-relaxed space-y-2`; each `<li>` has a leading two-digit mono index (`String(idx + 1).padStart(2, '0')`) and `tracking-wide` on the body for TC ideogram legibility per `ui-context.md:71-72`.
- Entity tags — `flex flex-wrap gap-2 mt-4 text-xs font-mono uppercase tracking-wide` (no background fill per `ui-context.md:74`); only render the row when `signal.tags.length > 0`.
- Container: `<article class="bg-elevated/40 border border-default rounded-2xl overflow-hidden">` with `px-6 py-5` on the body.

No click handler, no `router.push`, no `<NuxtLink>` wrap. Cards are non-interactive in this spec (the detail wiring is #14).

## Step 4 — Create `app/components/signal/signal-feed.vue`

Props: `items`, `isLoading` (= `status === 'pending'`), `isLoadingMore`, `hasMore`, `error` (boolean). Emits: `load-more` (parent owns the actual fetch), `retry` (parent calls `refresh()`).

Layout per `ui-context.md:130-142`:
- Outer wrapper `<div>`.
- Breakpoints: mobile (default) 1 column, tablet (`md` ≥ 768px) 2 columns, desktop (`xl` ≥ 1280px) 3 columns. The desktop 3-column layout is the dominant reading surface; tablet is transitional.
- Initial-load skeleton: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 md:px-8 lg:px-12` with **6** placeholder cards (fills 2 rows on the desktop 3-column grid) rendered with `<USkeleton class="h-96 rounded-2xl" />` when `isLoading && items.length === 0`.
- Error state: `<UEmpty icon="i-lucide-alert-circle" title="載入失敗" description="…" :actions="[{ label: '重試', onClick: () => emit('retry') }]" />` shown only when `error && items.length === 0` (subsequent `loadMore` failures do not clear the rendered list).
- Empty state: `<UEmpty variant="naked" icon="i-lucide-inbox" title="目前沒有任何訊號" description="…" />` when `items.length === 0 && !isLoading && !error`.
- Items grid: same `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10 … pb-16` container; maps `items` to `<SignalCard :signal="item" :key="item.id" />`. The vertical `gap-y-10` and bottom `pb-16` give the end-of-feed marker room to breathe.
- Sentinel `<div ref="sentinel" class="col-span-1 md:col-span-2 xl:col-span-3 h-1" />` rendered only when `hasMore` is true. Use VueUse's `useIntersectionObserver` on the sentinel with `rootMargin: '200px'`; when `entry.isIntersecting && hasMore && !isLoading && !isLoadingMore`, emit `load-more`.
- Loading-more indicator: a single centred `<UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />` + `text-xs font-mono uppercase tracking-wide text-muted` line spanning all 3 columns, under the grid when `isLoadingMore`.
- End-of-feed marker: a quiet visual terminus spanning all 3 columns — two hairlines flanking an `i-lucide-check` icon, with a `text-xs font-mono uppercase tracking-wide text-muted` label `已顯示全部訊號`. Rendered when `!hasMore && items.length > 0 && !isLoadingMore`. This reassures the user they reached the end without a hard "no results" tone.

# Out of Scope

- `app/composables/use-signal-feed.ts` — explicitly not needed; the page's `<script setup>` is the composable.
- Pinia stores (`useSignalFeedStore`, `useSignalDetailStore`).
- Detail modal, `app/pages/[[category]]/[slug].vue`, `<NuxtPage />` slot — all #14.
- Search / command palette.
- Card click handlers (no navigation, no router push) — #14.
- Slug-collision retries in the API.
- Caching beyond Nuxt's default `useFetch` payload behaviour.
- Wiring the existing visual `CategoryFilter` to the route (its click handler currently only updates a local ref). Open question for #14 or later.

# Check When Done

- `app/pages/index.vue` is deleted; the route is handled by `app/pages/[[category]].vue`.
- `pnpm dev` → `/` renders the feed; the first page is in the SSR payload (verifiable via Nuxt DevTools → Payload tab, key `signal-feed-all`).
- Switching to `/finance` updates the URL and triggers a refetch with the new key (`signal-feed-finance`); the displayed cards match the active category.
- Scrolling to the bottom appends the next page; no full refetch occurs; `items.length` grows by `FEED_PAGE_SIZE`.
- Reloading on `/finance` renders the same view with first-page data on first paint (no skeleton flash).
- `/invalid-category` renders a 404 page.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass.
