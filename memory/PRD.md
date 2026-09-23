# Ascend RPG — Fitness RPG App

## Overview
Single-user React Native / Expo mobile app that turns the user's personal workout & meal
plan into a full RPG progression system (27 ranks, quests, challenges, character,
leaderboard).

## Current Feature Set (this pass)

### Tabs
- **Home** — Dashboard: greeting, rank card, XP bar, streak, workouts, total XP,
  achievement counter, Today's Mission, Daily Quests preview, Weekly Challenge preview,
  nav grid (Challenges / Achievements / Leaderboard / Stats), notifications inbox button.
- **Workout** — Weekly calendar (browse any day: past/today/upcoming/rest). Sticky Mission
  Complete CTA. XP animation. Difficulty-aware bonus (HARD workouts pay +400 vs +250).
- **Fuel** — Multi-option meal picker per slot (Breakfast/Lunch/Dinner/Snack), hydration
  tracker with +250 ml tap and daily 2.5 L goal (+75 XP bonus).
- **Character** — Procedural SVG "operator" (unlockable outfit, hair, aura, badge tied to
  Character Level = 1 + floor(totalXP / 500)), rank badge, XP bar, editable name/title.

### Stack screens
- **/quests** — Daily + Weekly quests with progress tracking + Claim buttons.
- **/challenges** — 6 challenges across EASY / MEDIUM / HARD / ELITE / LEGENDARY tiers,
  auto-progress, badge titles unlockable.
- **/achievements** — 16 achievements (locked shows silhouette / lock icon).
- **/leaderboard** — Backend-driven Global + Nearby tabs, my global position banner,
  Immortal ribbon when at top rank.
- **/stats** — Rank ladder, all-time XP, 7d / 30d exercise counters, streak stats, reset.
- **/notifications** — Inbox for in-app RPG notifications.

### Rank System (27 ranks)
Initiate I-IV → Striker I-IV → Vanguard I-IV → Ironclad I-IV → Dominator I-IV →
Apex I-IV → Titan → Ascendant → Immortal. Rank auto-updates on XP change. Rank-up modal
plays for any rank increase, with a distinct "MAJOR PROMOTION" label for Apex+.

### XP Rewards (`src/data/xp.ts`)
- Exercise: +40, Workout: +250 (Hard: +400)
- Daily quest: +75 / +100 / +250, Weekly quest: +500 - +2000
- Challenge: +500 - +5000, Streak 7: +500, Streak 30: +2000
- Meal: +25, Hydration goal: +75

### Backend (`/app/backend/server.py`)
- MongoDB `users` collection (anonymous by device_id).
- POST `/api/users/upsert`, GET `/api/users/me`, GET `/api/leaderboard`.
- Startup seeds **608 NPC athletes** distributed from Initiate to Immortal. NPCs mix
  naturally into leaderboard so it looks alive from day one; real users appear as they
  join (NPCs stay until enough real users organically fill the pyramid).
- Progress hook fire-and-forget syncs XP + counters on every state change.

## Known Follow-ups
- **Push notifications — needs user action**: infra is fully wired (backend `/api/register-push`
  + `/api/notify` relay, `send_push` on friend-join, client registration + tap handlers in
  `app/_layout.tsx`). To go live the user must (1) add their Firebase `google-services.json`
  to `frontend/` (app.json already points to `./google-services.json`) and (2) Publish →
  Deploy → Generate builds. `EMERGENT_PUSH_KEY` stays `placeholder` until the deploy
  pipeline injects the real key. Cannot be tested in Expo Go/web.

## Recently Shipped (this session)
- **Badge Shelf**: Character page "RANK COLLECTION" grid of all 27 illustrated badges;
  earned (rank reached via totalXpEver) are bright, locked are dimmed with a lock icon.
- **Invite Rewards**: backend records a referral on the code owner when someone joins via
  their code; client pays +500 XP per new referral once (tracked by `rewardedReferrals`),
  with an inline reward banner in the Friends panel.
- **Squad Race Board**: weekly XP race in the Friends tab. Client syncs `week_key`/`week_xp`;
  `GET /api/friends` returns a `race.board` ranked by this week's XP (TZ-proof via max
  week_key), auto-resetting every Monday. Shows lanes with progress bars + reset countdown.
- **Push Alerts infra**: see follow-up above.

## Recently Shipped (this session)
- **Real badge art**: 27 illustrated rank badges (assets/badges/rank_01..27.png) sliced
  from the user-supplied grid with a soft black-key alpha. `src/data/rank-badges.ts` maps
  Rank.index → image; `RankBadge` now renders the illustrated art with a colored glow.
- **Immortal cinematic** (`src/components/immortal-cinematic.tsx`): full-screen dark reveal
  with expanding energy rings, rotating gold sunburst, badge burst, haptics and
  "ENTER THE PANTHEON" CTA. `RankUpModal` delegates to it whenever the new rank family is
  IMMORTAL (rank 27), so both Home and Workout entry points trigger it.
- **Friends & Squad**: anonymous friend-code linking. Backend adds `friend_code` +
  `friends[]` to users and endpoints `GET /api/friends`, `POST /api/friends/add`,
  `POST /api/friends/remove`. Leaderboard gains a FRIENDS tab (`src/components/friends-panel.tsx`)
  with share invite, add-by-code, Squad Power (combined XP), squad ranking and a rival
  XP-chase callout.

## Files
- `frontend/app/(tabs)/*.tsx` — Home / Workout / Fuel / Character
- `frontend/app/(screens)/*.tsx` — quests / challenges / achievements / leaderboard / stats / notifications
- `frontend/src/data/*.ts` — ranks, workouts, meals, game defs, xp
- `frontend/src/store/progress.ts` — local state store + backend sync
- `frontend/src/store/api.ts` — backend client
- `frontend/src/components/*.tsx` — rank-badge, xp-bar, xp-toast, character-svg, rank-up-modal
- `backend/server.py` — FastAPI with NPC seeder + leaderboard
