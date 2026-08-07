# Homepage SEO Content Expansion

## Goal
Expand the LifeLink homepage so it surfaces every major feature for search intent, improves keyword coverage, and strengthens structured data — without changing app behavior or navigation.

## Scope
- `src/components/RoomSelector.tsx` — homepage content
- `index.html` — static SEO fallback metadata and JSON-LD
- `src/pages/Index.tsx` — per-route Helmet (already present, will align with index.html)

## What to build

### 1. Hero and primary actions
Keep the existing LifeLink hero, NEW GAME / Join with code glass panel, and recent rooms list. Do not alter functionality.

### 2. Expanded feature coverage
Add a comprehensive feature section below the glass panel that covers every major capability:
- Cloud-synced rooms for 2–6 players
- Commander / EDH support with partner commanders
- Modular counters: commander damage, poison, energy, experience, monarch, initiative
- Day / night tracker
- Deck / commander name labels
- Multiple table layouts and player orientations
- Mobile-first design with large tap targets and haptic feedback
- Keyboard shortcuts on PC
- History log with undo context
- Color customization per player panel
- Game presets for recurring playgroups
- Read-only OBS Browser Source overlay
- Embeddable widget / iframe
- Native Twitch extension
- Short join codes and QR codes for fast room entry
- 24-hour room data retention

Present these in semantic, scannable cards grouped by theme (Play, Stream, Customize) using existing design tokens.

### 3. "How it works" section
Add a short 3-step HowItWorks block: Create room → Share code/QR → Track & stream.
Use semantic ordered list markup.

### 4. FAQ section for SEO
Add a small FAQ with questions that match likely search queries:
- What is LifeLink?
- Does it support Commander / EDH?
- How do players join the same room?
- Can I use it with OBS or Twitch?
- Is it free?
- What devices does it work on?

### 5. Metadata updates
Update `index.html`:
- Title: include MTG, Commander, EDH, life counter, OBS overlay, Twitch extension
- Description: longer, feature-rich summary
- Keywords: expand to cover commander damage, poison counters, stream overlay, etc.
- JSON-LD: keep WebSite and SoftwareApplication, add FAQPage schema referencing the FAQ section

Update `src/pages/Index.tsx` Helmet to mirror the enhanced title/description.

### 6. Design constraints
- Use existing Tailwind tokens and semantic colors; no hardcoded colors
- Keep mobile-first spacing consistent with recent RoomSelector edits
- Preserve all interactive behavior and route logic
- Add semantic section/heading structure and alt text where icons are decorative

## Verification
- Run `tsgo` typecheck
- Open preview and confirm the new sections render cleanly on desktop and mobile
- Confirm no duplicate canonical tags or conflicting metadata