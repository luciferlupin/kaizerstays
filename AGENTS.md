<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Channel Manager Synchronization Rule

Always keep the software, PMS database models, room categories, rate plans, and API routes strictly aligned with the live Channel Manager (Aiosell) configuration:
- **Active Property:** Hotel Shemron, Neemrana (`62a25484e5`)
- **Aiosell Auth / Account:** `ninaad.khera18@gmail.com` (Password: `aiosell`)
- **Room Categories & Physical Room Counts:**
  - `deluxe-room` (Deluxe Room) — 28 Rooms (Base Rate: ₹2,800)
  - `twin-room` (Twin Room) — 2 Rooms (Base Rate: ₹2,800)
  - `suite-room` (Suite Room) — 2 Rooms (Base Rate: ₹5,500)
- **Standard Rate Plan Codes:**
  - Deluxe: `deluxe-room-s-ep`, `deluxe-room-d-ep`, `deluxe-room-s-cp`, `deluxe-room-d-cp`
  - Twin: `twin-room-s-ep`, `twin-room-d-ep`, `twin-room-s-cp`, `twin-room-d-cp`
  - Suite: `suite-room-s-ep`, `suite-room-d-ep`, `suite-room-s-cp`, `suite-room-d-cp`
- **Two-Way Sync Integrity:** Whenever room inventory, pricing, reservations, or front desk features are modified, ensure full compatibility with `/api/channels/aiosell`, `/api/webhooks/aiosell`, and `https://live.aiosell.com/api/v1/rms`.

