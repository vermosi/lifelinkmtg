# LifeLink Twitch Extension

Read-only life totals rendered natively inside Twitch — as a channel **panel** and as a
**video overlay** component. No OBS Browser Source, no manual iframe.

## Files

| File | Twitch view |
| --- | --- |
| `panel.html` | Panel (below the player) |
| `video_overlay.html` | Video — Fullscreen / Overlay component |
| `config.html` | Broadcaster Configuration |
| `lifelink-api.js` | Shared read-only data layer (public `get_room_public` RPC) |
| `viewer.js` | Panel + overlay runtime, 2s polling with backoff |
| `config.js` | Broadcaster config page logic |
| `lifelink.css` | Styles |

## Publishing (Twitch Developer Console)

1. Go to <https://dev.twitch.tv/console/extensions> → **Create Extension**.
2. Type: enable **Panel** and **Video - Fullscreen / Video - Component**.
3. **Asset Hosting**:
   - Testing Base URI: your local `https://localhost:8080/` dev server (Twitch requires HTTPS), or upload the ZIP for hosted testing.
   - Panel Viewer Path: `panel.html`
   - Video Overlay Path: `video_overlay.html`
   - Config Path: `config.html`
   - Panel Height: `400`
4. **Capabilities → Allowlist for URL Fetching Domains**, add:
   `qswjlzfcznlnepilmgtp.supabase.co`
   (Without this, Twitch's CSP blocks the life-total requests.)
5. **Files** tab → upload `lifelink-twitch-extension.zip` → **Create version / Move to hosted test**.
6. On your channel: **Manage Extensions → My Extensions → Activate** as a Panel and/or Video Overlay.
7. Click the extension's **Configure** button, paste your LifeLink room code, press **Save**.

## Local preview (outside Twitch)

Open `panel.html?room=YOUR_ROOM_CODE` from any static server. The Twitch helper is absent, so the
runtime falls back to the `room` query parameter.

## Security notes

- Only the publishable anon key ships in the bundle; all reads go through the `get_room_public`
  RPC, which never returns `admin_key`.
- The extension cannot mutate a game. There is no write path.
- Room codes are validated against `^[A-Za-z0-9]{4,32}$` before any request.
