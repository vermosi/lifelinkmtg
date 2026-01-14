# LifeLink

Track. Play. Win.

LifeLink is a cloud-synced Magic: The Gathering life counter with an OBS-ready overlay. Spin up a room, share the link with your table, and keep every device in sync in real time.

## ✨ Features

- **Cloud rooms** with shareable control + overlay links.
- **Life, commander damage, poison, energy, and experience** tracking.
- **Monarch, initiative, and day/night** indicators.
- **Preset playgroups** to jump into your favorite setups quickly.
- **Dice roller** for quick decisions and random starts.
- **Customizable overlay** layout for streaming tools like OBS.
- **Realtime sync** across all players and devices.

## 🧭 How it works

1. Create a room and pick the player count.
2. Share the control link for players (admin link enables edits).
3. Open the overlay link inside OBS as a browser source.
4. Track life totals and counters while the overlay updates live.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Install & Run

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

## 🔐 Environment Variables

LifeLink uses Supabase for realtime state sync. Set the following variables:

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

## 🧰 Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Realtime)

## 📁 Project Structure

```text
src/
  components/   # UI building blocks
  hooks/        # React hooks (room sync, etc.)
  lib/          # room logic + helpers
  pages/        # route-level views
```

## 🗺️ Roadmap Ideas

- Match history export
- Custom themes per room
- Mobile-friendly overlay presets

---

Built for MTG tables and streamers who want a clean, synced scoreboard.
