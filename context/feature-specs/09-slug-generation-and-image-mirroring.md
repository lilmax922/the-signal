# Objective

Generate a slug for each news item based on the title and published date, and mirror the image to Supabase storage, returning the public URL.

# Implementation

## Step 1 - Slug generation

Uses de-noised `titleEn` from LLM output and `publishedAt` to generate slug, for example: `this-is-the-title-20260531`

- Create `trigger/utils/slug.ts`, add `generateSlug` function.
- Accepts `title`, `publishedAt` params.
- Convert publishedAt to `YYYYMMDD`.

## Step 2 - Image mirroring to Supabase storage

Download the image, upload it to supabase storage and return the public URL to be stored in the database later.

- Create `shared/utils/create-storage-client.ts` (exported as `createStorageClient()`) — implementation note: the spec originally placed this in `server/utils/`, but since the client is only consumed from `trigger/`, it was moved to `shared/` to keep cross-boundary dependencies clean.
- Create `trigger/utils/mirror-image.ts`, add `mirrorImage`.
- Accepts `imageUrl` param and return the public URL.

**Operational prerequisite**: a Supabase Storage bucket named `signal-images` must exist with public-read access. Without it, `mirrorImage` throws on upload.

## Step 3 - Return slug and mirrored image URL from the Trigger.dev job.

- Update the job to return an object containing `slug` and `mirroredImageUrl` after processing each news item.

## Step 4 - Compress mirrored images to < 100 KB

- Added `sharp` as a direct dependency. Prebuilt binaries cover the linux x64/arm64 workers used by Trigger.dev, so no system-package build extension is required.
- `mirrorImage` now re-encodes every downloaded image to **WebP** (quality 80 by default, max width 1280 px) before uploading. WebP gives ~30 % smaller files than JPEG at equivalent quality and preserves animation when the source is a GIF.
- A **soft 95 KB target** is enforced: if the quality-80 result exceeds 95 KB, the pipeline retries at quality 65 and uploads the smaller of the two buffers. Going over the soft target is a logged warning, not a failure — it never blocks the job.
- If `sharp` itself throws (SVG, malformed input, etc.), the original bytes are uploaded as a best-effort fallback. The `image_url: null` invariant only applies to upload failures, not to compression outcomes.

# Out of Scope

- Storing the data in the database.
- Slug collision detection (`-2`, `-3`, …). The RSS ingestion task already deduplicates by `guid` before articles reach the refinery, so collisions from a single source are not expected. If two distinct articles on the same day produce the same title-derived slug, this is treated as a known limitation and is expected to be addressed when the persistence layer is added.

# Check When Done

- Slug is generated correctly based on the title and published date.
- Images are mirrored to Supabase storage and the public URL is returned.
- The Trigger.dev job returns the expected data structure with slug and mirrored image URL.