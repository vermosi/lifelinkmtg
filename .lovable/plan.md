Here are suggested improvements based on the project's history and current state. Pick any subset you want and I'll build them.

## 1. OBS / Overlay polish (recent focus area)
- **Preset thumbnails in the Share tab** — small visual chips for each overlay preset so streamers can pick a layout without opening the editor.
- **Per-preset color themes** — save color picks per preset (not just per room), so switching preset restores its palette.
- **Overlay diagnostics banner** — inside the read-only overlay, show a tiny toast if the room isn't reachable or the URL params failed to parse (currently silent).
- **"Copy as OBS scene" JSON** — export a `.json` scene collection snippet with the Browser Source pre-configured (URL, 1920×1080, refresh settings). One import in OBS instead of manual setup.
- **Overlay refresh throttle** — the polling sync runs at 2s; the overlay could drop to 3–5s to reduce load when only spectators watch.

## 2. Room sync & reliability
- **Optimistic updates with rollback** — life taps currently wait on the poll cycle to reconcile; adding local optimistic state would make mobile feel instant.
- **Reconnect / offline indicator** — a small dot in the header showing "syncing / offline / stale" so users know when polling stalls.
- **Idempotency keys on RPC mutations** — protect against double-tap network retries applying life changes twice.
- **Room TTL / cleanup** — auto-archive rooms with no activity for N days to keep the DB tidy.

## 3. Mobile UX
- **Wake-lock during a game** — request `navigator.wakeLock` so phones don't sleep mid-match.
- **Haptic on long-press ramp** — subtle escalating vibration as the ramp speeds up.
- **Landscape lock hint** for 3–4 player rotated layouts on first entry.
- **PWA install + offline shell** — manifest + service worker so LifeLink installs to home screen.

## 4. Features that fit the roadmap
- **Match history export** — download the History Log as CSV/JSON at end of game.
- **Turn timer / chess-clock mode** in the Tools Drawer.
- **Undo last action** button surfaced from the History Log (one-tap revert of the most recent life/counter change).
- **Deck archetype quick-pick** — dropdown of previously used deck names per room owner instead of retyping.

## 5. Code health
- **Split `RoomControl.tsx`** — it now owns Share, Checklist, Troubleshooting, OBS preview, QR, admin actions. Extract `ShareTab`, `ObsSetupGuide`, `BrowserSourceChecklist`, `ObsPreview` into their own files under `components/room-control/`.
- **Extract a `services/` layer** for Supabase RPC calls (per workspace standards — UI components shouldn't call the client directly).
- **Typed room-state schema** — a single `zod` schema for the payload persisted in `useCloudRoomState` (layout, name visibility, colors, preset) to prevent drift between overlay URL params and cloud state.
- **Unit tests for `roomUtils.ts`** — URL encode/decode is now security-adjacent (drives overlay state); worth a small vitest suite.

## Suggested first batch
If you want a focused next step, I'd recommend: **optimistic life updates + sync status indicator + wake-lock** — three small, high-impact changes that make the core tracker feel dramatically better on mobile.

Tell me which items to plan in detail and I'll produce an implementation plan.
