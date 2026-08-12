# LifeLink — Next cleanup pass

Goal: knock out the remaining SEO, security, product-polish, and codebase-hygiene items that are still open.

## 1. SEO: unique social previews for /twitch-extension and /embed

- Add `<meta property="og:title">`, `<meta property="og:description">`, and `<meta property="og:url">` to:
  - `src/pages/TwitchExtensionPage.tsx`
  - `src/pages/EmbedPage.tsx`
- Keep the existing `canonical` and `robots` tags on `/embed`.
- Mark `agent_metadata:social_preview` as fixed after the change.

## 2. Security: tighten RPC grants on SECURITY DEFINER functions

- Audit which functions are actually called by the client:
  - Public API: `get_room_public`, `update_room_as_admin`, `delete_room_as_admin`, `verify_room_admin` — keep anon/authenticated EXECUTE.
  - Internal/cron: `cleanup_stale_rooms` — revoke EXECUTE from `anon` and `authenticated`, leave only `service_role`.
  - `get_recent_rooms` — check if used; if not, revoke public EXECUTE.
- Run the security scan again and mark the two `SUPA_*_security_definer_function_executable` warnings fixed/ignored with a written rationale.

## 3. Product: add a cookie consent banner

- Create `src/components/CookieConsent.tsx` with Accept / Reject / Manage choices.
- Persist preference in localStorage.
- Wire it into `MainApp.tsx` so it appears on first visit.
- Link to `/cookies` from the banner.
- Only enable non-essential cookies (e.g., analytics) after explicit acceptance.

## 4. Codebase hygiene

- Replace remaining `console.error` calls in user-facing flows with proper UI feedback or silent handling where appropriate:
  - `src/lib/cloudRoomUtils.ts`
  - `src/hooks/useCloudRoomState.ts`
  - `src/components/RoomControl.tsx`
- Update `README.md`:
  - Replace "Supabase Realtime" references with the current polling/RPC sync model.
  - Update the mermaid diagram to reflect polling.
- Remove the placeholder `Add ?roomId=XXXX to the URL.` text in `ObsOverlayView.tsx` if a better empty state is needed.

## Success criteria

- SEO scan shows `agent_metadata:social_preview` passing or fixed.
- Security scan no longer flags the RPC grant warnings, or they are documented as accepted.
- Cookie banner renders on first visit and respects the user's choice.
- Build/typecheck passes and the homepage still scrolls correctly.
