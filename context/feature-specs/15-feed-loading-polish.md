# Objective

Improve the loading experience and visual quality of the Signal Feed and Signal Detail views. This includes skeleton loading states, cache-driven category switching, image optimization, tag visual differentiation, a copy-link action, and detail layout restructuring.

# Packages to Install

| Package | Purpose |
|---------|---------|
| `@nuxt/image` | Optimized image rendering (replaces native `<img>`) |

# Implementations

## Step 1 — Install Dependencies & Configure Nuxt

Install `@nuxt/image`. Add it to the `modules` array in `nuxt.config.ts` (`'@nuxt/image'`). Configure `image.supabase.baseURL` pointing to the Supabase Storage render endpoint (`${NUXT_PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/signal-images`). Configure the NuxtUI toast via the `<UApp :toaster="toaster">` prop in `app.vue` with responsive positioning (`bottom-center` on mobile, `bottom-right` on desktop) and `expand: false` for stacked toasts.

## Step 2 — Create Skeleton Components

Create `app/components/signal/signal-card-skeleton.vue`. Reproduce the signal-card anatomy with `<USkeleton>`: an `aspect-video` image block, two title lines, three summary lines, and a tags row — all using the pulse animation.

Create `app/components/signal/signal-detail-skeleton.vue`. Reproduce the signal-detail anatomy with `<USkeleton>`: header row, hero image, title, tags, summary bullets, and content lines.

## Step 3 — Refactor Signal Card (NuxtImg + UBadge Tags)

In `signal-card.vue`, replace `<img>` with `<NuxtImg>`. Wrap it in a `<div>` with `aspect-video w-full rounded-t-2xl overflow-hidden bg-elevated/40` to provide a background placeholder before the image loads, preventing layout shift.

Replace the plain-text tags with `<UBadge>` using `color="primary" variant="soft" size="sm"` and `font-mono uppercase`. This creates a filled-background look that is visually distinct from the category badge, which uses `variant="outline"` (border-only).

## Step 4 — Restructure Signal Detail (Layout + NuxtImg + UBadge + Copy Link)

Reorder `signal-detail.vue` from top to bottom:

1. **Header** — Category badge, date, copy-link button, close button
2. **Hero image** — `<NuxtImg>` with `loading="eager"` (LCP image)
3. **Title**
4. **Tags** — `<UBadge>` soft badges, placed directly below the title so they feel like metadata rather than an interruption
5. **Summary** — 3-point structured list
6. **Content** — full article text
7. **Separator**
8. **Source link**

Replace all `<img>` with `<NuxtImg>`. Add a copy-link button in the header that calls `navigator.clipboard.writeText(url)` with a `signal/{slug}` path and shows a toast via `useToast().add({ title: '連結已複製', color: 'success' })` on success or `useToast().add({ title: '複製失敗', color: 'error' })` on failure.

## Step 5 — Update Signal Detail Overlay

In `signal-detail-overlay.vue`, replace the plain-text "載入中…" with `<SignalDetailSkeleton>` during loading. Replace the plain-text "載入失敗" with `<UEmpty>` showing an error icon, description, and a retry button. The overlay only renders on the client (Reka UI Teleport), so skeletons appear client-side only.

## Step 6 — Feed Cache Mechanism & Loading Bar

The signals API endpoints uses Nitro's `routeRules` with `maxAge: 60 * 60 * 24 * 30` (30-day).

In `[[category]].vue`, remove the `watch` option from `useFetch`. Category changes now trigger refetches automatically through the reactive `key` change — no manual watch needed.

The skeleton logic: `isLoading = status === 'pending' && items.length === 0`. On initial load (no cache), `items` is empty → skeleton cards are shown. On category switch (no cache), `items` still holds the previous category's cards → old cards stay visible while new data loads in the background.

In `signal-feed.vue`, add a subtle loading bar at the top of the feed when switching categories without cache: `v-if="status === 'pending' && items.length > 0"` rendered as a thin animated bar (`fixed top-0 left-0 right-0 h-0.5 bg-primary/50 animate-pulse z-50`). This provides feedback without clearing the existing content.

## Step 7 — Update SSR Detail Page

In `app/pages/signal/[slug].vue`, replace the loading state's plain text with `<SignalDetailSkeleton>`. Replace `<img>` with `<NuxtImg>`. The skeleton only appears during client-side navigation; SSR renders the full content immediately.

## Step 8 — Lint / Typecheck / Build

Run `pnpm lint --fix` to auto-fix code style. Run `pnpm typecheck` to verify type correctness. Run `pnpm build` to confirm the build passes.

# Out of Scope

- Automatic cache expiration (TTL) — caches persist for the session; manual refresh via `refresh()`
- Pull-to-refresh gesture
- LQIP (Low Quality Image Placeholder) — a solid background color serves as the placeholder

# Check When Done

- Initial feed load shows skeleton cards instead of a blank screen
- Category switch with cache is instant (no skeleton, no loading bar)
- Category switch without cache keeps old cards visible with a top loading bar
- All images render via `<NuxtImg>` with a background-color placeholder preventing layout shift
- Tags use `UBadge` soft variant (filled background); Category uses outline variant (border) — visually distinct
- Signal Detail tags sit between the title and summary, not interrupting the reading flow
- Copy Link button copies the current URL as `signal/{slug}` and NuxtUI toast shows a success/error notification
- Detail overlay shows a skeleton during loading, not plain text
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass
