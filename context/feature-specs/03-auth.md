# Objective

Supabase is already installed by running `@nuxtjs/supabase`. Wire up with Nuxt 4 app: provider, auth pages, redirects, route protection by following nuxt skill best practices.

We are using NuxtSupabase (https://supabase.nuxtjs.org/), so you can first check "https://supabase.nuxtjs.org/getting-started/authentication" using Context7 to find out how to implement auth, for more Supabase informations, you can read official skills under directory `.agents/skills/` and Official MCP we already enabled.

This app need users to login before accessing any page except the login page itself, once logged in, the user will be redirected to the root page `/`.

## Design

Use NuxtUI `AuthForm` to implement login form and wrap it in `PageCard`.

AuthForm only contains OAuth login providers: `Google` and `GitHub`.

### Login page:

- large screens: 
  - simple two-panel layout, make the layout look comfortable and not too dense.
  - left: overall position closer to the left, compact logo and app name on the top left, tagline, 2 lines description and short feature list(contains icon, title and short description).
  - right: centered login form contains `The Signal` at the top, description and OAuth: GitHub and Google, using AuthForm component.
- small screens: form only
- no gradient
- no oversized hero sections
- no feature cards
- no scroll-heavy layouts

Keep the layout minimal and professional.

### Confirm page:

The confirmation page receives the supabase callback which contains session information. The supabase client automatically detects and handles this, and once the session is confirmed the user value will automatically be updated. From there you can redirect to the appropriate page.

- `The Signal...` text with character by character bouncing (each character bounce slightly up and down in a cycle) animation in the center of the page.


## Implementation

- Configure `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY` in `.env` and `.env.example`.
- Create `login` and `confirm` pages using Nuxt UI.
- Create Nuxt middleware in `app/middleware/auth.global.ts` to protect routes:
  - authenticated users redirect to `/`.
  - unauthenticated users redirect to `/login`.
  - if user logged out or access token expires, redirect to `/login`.
- Update `UserDropdownMenu` to use user avatar image from provider.

## Check When Done

- Unauthenticated users can not access any page except `/login`.
- Unauthenticated users will be redirected to `/login` when accessing any pages.
- Authenticated users will be redirected to `/` when accessing `/login`.
- When authenticated, show user avatar in the header.
- User can login with Google and GitHub, and logout.
- `The Signal...` text with char by char bouncing animation in confirm page.
- Access token expires or user logged out should redirect to `/login`.




