# Publish the LifeLink Twitch Extension officially

Goal: get LifeLink listed in the Twitch Extension directory so any broadcaster installs it in one click, instead of downloading the ZIP and creating their own extension.

## What I can and cannot do

Twitch extension publication happens entirely inside the Twitch Developer Console under your Twitch account. Creating the extension, uploading assets, filling the review form and clicking "Submit for Review" cannot be automated from here — Twitch has no API for it, and the account/legal identity must be yours.

What I can do is make the submission pass review on the first try: Twitch rejects extensions for missing pages, broken test instructions, and unclear data handling far more often than for code problems. So this plan prepares everything the reviewer asks for, then hands you an exact click-by-click submission script.

## 1. Review-readiness fixes in the extension bundle

Checked against Twitch's extension review requirements:

- Add a short "About / read-only" line and a link to `lifelinkmtg.app/privacy` inside `config.html`, so the reviewer sees data handling without leaving the extension.
- Make the panel's zero-config state explicit: when no room is configured, the panel must render a friendly "Broadcaster has not linked a game yet" state rather than an error banner. Reviewers open the panel before configuring and fail extensions that show errors.
- Confirm no external requests other than the LifeLink data domain (reviewers check the network tab); remove anything else if found.
- Rebuild `public/lifelink-twitch-extension.zip` after the changes.

## 2. Reviewer-facing collateral

- New page `src/pages/TwitchReviewPage.tsx` at `/twitch-review` (noindex): a permanent, always-live demo room code plus step-by-step testing instructions the reviewer can follow. This is the single most common rejection cause — reviewers need a working room code that never expires.
- A demo room seeded in the database and excluded from the 24-hour stale-room cleanup, so the code in those instructions never goes dead mid-review.
- Screenshots for the store listing: panel view, video overlay view, and config view, sized to Twitch's requirements (discovery icon 750x500, screenshots 1920x1080).
- Draft listing copy: summary, description, category (Tabletop / Just Chatting), and support email.

## 3. Submission script for you

A checklist written to `twitch-extension/SUBMISSION.md` with the exact values to paste into each Developer Console field: asset paths, panel height, the URL-fetching allowlist domain, required permissions, version notes, and the testing instructions block. You follow it once; review usually takes 5-10 business days.

## 4. After approval

- Replace the ZIP download on `/twitch-extension` with the official "Install on Twitch" link, keeping the ZIP as a fallback for self-hosters.
- Update `/llms.txt` and the homepage feature card to say the extension is installable from the Twitch directory.

## Technical notes

- The extension stays read-only and unauthenticated; it uses the public `get_room_public` RPC with the publishable anon key, which is acceptable for Twitch review as long as the privacy link explains it.
- The demo room needs a cleanup exemption — a boolean column or an id allowlist in the `cleanup_stale_rooms` function.
- No changes to the game app's write paths.

## Open question

I need to know which Twitch account will own the extension (your personal channel account, or a separate LifeLink developer account), because the support email and legal entity in the listing must match it. Tell me and I will fill it into the submission checklist.
