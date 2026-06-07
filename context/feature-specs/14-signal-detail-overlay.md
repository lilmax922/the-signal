# Objective

Implement the consumer-side detail view for a single signal. Clicking a feed card pushes `?signal=slug` query and opens a modal layered above the feed (the feed stays mounted in the background — no narrowing, no layout reflow). The modal renders the full signal — header, hero image, title, 3-point summary, entity tags, body, source link. Closing the modal (button or browser back) removes the query via `router.push`. The URL is the source of truth: refresh works, deep links work, back/forward works. A separate SSR detail page at `/signal/{slug}` serves crawlers and direct shares.

# Implementation

## Step 1 — Card click → query

Modify `app/components/signal/signal-card.vue` to replace `<NuxtLink>` with `<article @click>` that calls `router.push({ query: { ...route.query, signal: slug } })`. Add keyboard support via `@keydown.enter`. The card is unaware of the modal — it only knows the query param.

## Step 2 — Feed page overlay host

Modify `app/pages/[[category]].vue` to read `activeSlug` from `route.query.signal`. Render `<SignalDetailOverlay :slug="activeSlug" />` when a slug is present.

## Step 3 — Overlay component (owns everything)

Create `app/components/signal/signal-detail-overlay.vue`. This component owns the full overlay lifecycle:

- Use `useMediaQuery('(min-width: 1024px)')` to determine desktop vs mobile
- Render `<USlideover>` (side=right) on desktop, `<UDrawer>` (direction=bottom) on mobile
- Use `useAsyncData` with `watch: [() => props.slug]` to fetch from `/api/signals/{slug}`
- Render loading, error, and detail states
- `handleClose()` calls `router.push({ query: { signal: undefined } })` (removes the signal query param, creates a history entry for browser back/forward)

The component is self-contained — the layout just passes the slug.

## Step 4 — SSR detail page

Create `app/pages/signal/[slug].vue`. Read `route.params.slug`. Call `useFetch<Signal>(`/api/signals/${slug}`)` server-side. Render `<SignalDetail>` with a back link to `/`. This page serves crawlers and direct links — the modal's Reka UI Teleport does not render during SSR.

## Step 5 — Pure rendering component

Create `app/components/signal/signal-detail.vue` with props `{ signal: Signal }` and emits `close: []`. Pure rendering — no viewport logic, no focus management, no modal chrome. Anatomy: header (category badge + time + close button), hero image, title, 3-point summary, entity tags, body, source link.

## Step 6 — Feed page cleanup

Modify `app/pages/[[category]].vue` to remove all modal logic (USlideover, NuxtPage, isOpen, closeDetail, router). The feed page becomes a pure feed host with zero modal awareness.

## Step 7 — Cleanup

Delete `app/pages/[[category]]/[slug].vue`. Clean up `app/components/category-filter.vue` — remove debug `console.log` statements. `app/router.options.ts` unchanged — scroll suppression already works for same-path navigations.

# Out of Scope

- **`vue-sonner` copy-link toast**. Deferred to #15. v1's header has only the close button.
- **`signal-detail-skeleton.vue`** + polished 404 / error / retry UX. Deferred to #15. v1 uses plain loading/error placeholders.
- **Cross-signal navigation, image lightbox, share menu, focus trap enhancements**. All out of scope.

# Check When Done

- Card click pushes `?signal=slug` and opens the overlay with the signal's full content. The feed stays mounted in the background.
- Desktop ≥1024px renders USlideover (side=right); mobile <1024px renders UDrawer (direction=bottom).
- The close button triggers `router.push` → removes query → overlay closes → feed stays mounted.
- Direct deep link to `/signal/{slug}` renders full SSR content for crawlers.
- Browser back / forward correctly open and close the detail.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` all pass.
