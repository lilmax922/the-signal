# Objective

Add the composite + per-category partial indexes required by cursor pagination, and drop the now-redundant single-column `idx_signal_published_at` index. Keep the signal table queryable in O(log n) at any depth as it grows.

# Implementation

## Step 1 - Drop the redundant `idx_signal_published_at`

The new composite index supersedes the single-column index via Postgres's B-tree leftmost prefix rule. Keeping both duplicates write overhead for no query benefit.

## Step 2 - Composite index on (published_at DESC, id DESC)

Anchors the `WHERE (published_at, id) < (?, ?)` row-tuple comparison that powers cursor pagination. The `id` half is the tiebreaker when two rows share the same `published_at`. Use `id`, not `slug`, as the cursor key — `id` is a fixed-size immutable UUID and the canonical internal handle; `slug` is a variable-length public URL identifier.

## Step 3 - Per-category partial indexes

Three partial indexes on the same composite, one per category (`finance`, `tech`, `world`). Filtered feed queries hit these small indexes instead of scanning the full composite.

## Step 4 - Retain `idx_signal_category_published` as legacy

Keep the existing `(category, published_at DESC)` index for non-cursor queries that filter by category only (admin views, future back-office tasks).

# Out of Scope

- Cursor pagination on other fields (e.g. `created_at`) or other entities.
- Offset pagination.
- Adding a `check('signal_category_check', …)` constraint — the `pgEnum` already enforces it.

# Check When Done

- `idx_signal_published_at` is dropped.
- `idx_signal_published_at_id` exists on `(published_at DESC, id DESC)`.
- Three per-category (`finance`, `tech`, `world`) partial indexes exist on the same composite.
- `idx_signal_category_published` is retained.
- The Drizzle-generated migration applies cleanly to the live DB.
