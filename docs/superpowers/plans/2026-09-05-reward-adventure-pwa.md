# 获得奖励冒险 PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, offline-capable PWA named “获得奖励冒险” for daily check-ins, monthly goals, star points, rewards, local editing, and backup/restore.

**Architecture:** A small React + Vite client with pure rule/calculation modules separated from UI. Local storage holds a versioned app state; a storage adapter boundary keeps a later cloud-sync migration possible. The app has four screens—今日任务、冒险地图、星星商店、设置—and a service worker plus web manifest for offline use and home-screen installation.

**Tech Stack:** React, Vite, plain CSS, browser localStorage, Web App Manifest, Service Worker, Node’s built-in test runner for pure logic, and browser smoke checks at a mobile viewport.

**Spec:** `docs/superpowers/specs/2026-09-05-reward-adventure-design.md`

## Global Constraints

- First version is local-only: no account, password, server, or cloud database.
- Use the exact app name “获得奖励冒险” and the game-level visual direction with stars, streaks, badges, and month progress.
- A check-in toggles on/off directly; no parent password is used.
- Default rules must include the 12 tasks and seven rewards from the design spec, while settings can add, edit, disable, and delete them.
- Month records reset for daily counts but unused points carry forward; history remains viewable.
- Export/import uses a local JSON backup and never uploads data.
- Existing `sources/`, generated previews, and local artifacts remain out of the application bundle.

---

### Task 1: Scaffold the React PWA and test harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles.css`
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Create: `tests/smoke.test.mjs`

**Interfaces:**
- Produces a Vite `dev` script and a browser entry that renders `App`.
- `App` exposes the four top-level navigation labels and renders the default task screen.
- `public/sw.js` caches the app shell and serves cached assets when offline.

- [ ] **Step 1: Write the failing smoke test**

  Add a Node test that checks the scaffold files exist and that `package.json` exposes `dev` and `build` scripts.

- [ ] **Step 2: Run the test and verify it fails**

  Run `node --test tests/smoke.test.mjs`; expect failure because the scaffold does not exist yet.

- [ ] **Step 3: Write the minimal scaffold**

  Use React with Vite, render a placeholder app titled “获得奖励冒险”, add a mobile viewport meta tag, and register the service worker from `src/main.jsx`.

- [ ] **Step 4: Run the test and build**

  Run `node --test tests/smoke.test.mjs` and `npm run build`; expect both to pass.

- [ ] **Step 5: Commit**

  Run `git add package.json index.html src public tests/smoke.test.mjs && git commit -m "chore: scaffold reward adventure pwa"`.

### Task 2: Add the versioned state model, default rules, storage, and calculations

**Files:**
- Create: `src/domain/defaults.js`
- Create: `src/domain/model.js`
- Create: `src/domain/calculations.js`
- Create: `src/domain/storage.js`
- Create: `tests/domain.test.mjs`

**Interfaces:**
- `createInitialState(now = new Date())` returns `{version, settings, tasks, rewards, months, pointsLedger, redemptions}`.
- `toggleDailyCheckIn(state, dateKey, taskId)` returns a new state with the daily task toggled.
- `setGoalStatus(state, monthKey, taskId, status)` records a manual exam/goal status.
- `getMonthSummary(state, monthKey)` returns counts, streaks, earned points, available points, and goal statuses.
- `redeemReward(state, monthKey, rewardId)` returns `{state, ok, reason}` and never allows a negative balance.
- `loadState(storage = localStorage)` returns a migrated initial state when no valid state exists; `saveState(state, storage)` persists JSON.

- [ ] **Step 1: Write failing domain tests**

  Cover the 12 default task definitions, direct toggle on/off, five-day homework streak, five/seven-day piano non-duplication, monthly count targets, point carry-forward, insufficient-balance rejection, and JSON round-trip.

- [ ] **Step 2: Run domain tests and verify failure**

  Run `node --test tests/domain.test.mjs`; expect missing-module or missing-function failures.

- [ ] **Step 3: Implement defaults and pure calculations**

  Store each task with an id, label, target type, threshold, points, enabled flag, and whether it is daily or manually confirmed. Keep all streak/count logic in `calculations.js` with deterministic date-key inputs.

- [ ] **Step 4: Implement storage and migration**

  Use one namespaced localStorage key, validate the top-level version, and fall back to `createInitialState()` for missing or malformed data. Keep the storage adapter functions independent of React.

- [ ] **Step 5: Run tests and commit**

  Run `node --test tests/domain.test.mjs`; expect all domain tests to pass, then commit with `git add src/domain tests/domain.test.mjs && git commit -m "feat: add local reward and streak domain"`.

### Task 3: Build the four screens and game-level interaction

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/BottomNav.jsx`
- Create: `src/components/TaskCard.jsx`
- Create: `src/components/ProgressHero.jsx`
- Create: `src/screens/TodayScreen.jsx`
- Create: `src/screens/MapScreen.jsx`
- Create: `src/screens/RewardsScreen.jsx`
- Create: `src/screens/SettingsScreen.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- `TaskCard({task, status, detail, onToggle})` renders a touch-friendly check-in control.
- `ProgressHero({summary})` renders today’s stars, streak, and progress.
- `BottomNav({screen, onChange})` switches among `today`, `map`, `rewards`, and `settings`.
- Screens receive `{state, monthKey, summary, dispatch}` and never write localStorage directly.

- [ ] **Step 1: Add component-level interaction tests**

  Extend the smoke test with a built-page check that the default page contains “获得奖励冒险”, “今日任务”, and all four navigation labels; add a browser-level check after the dev server exists that tapping a task changes its completed state.

- [ ] **Step 2: Implement the default 今日任务 screen**

  Show the current date, today’s star count, streak, enabled daily tasks, manually confirmed goals, and a direct toggle action. Keep completed cards visibly distinct and allow a second tap to undo.

- [ ] **Step 3: Implement 冒险地图**

  Render the current month calendar, completed-day markers, streak summary, monthly target progress, and earned badges. A day selection shows that day’s completed tasks.

- [ ] **Step 4: Implement 星星商店**

  Render current points, default rewards, disabled insufficient-balance buttons, redemption confirmation, and recent redemptions.

- [ ] **Step 5: Implement 设置**

  Add task/reward editing forms, enabled toggles, month archive list, and links to backup actions supplied by later tasks.

- [ ] **Step 6: Apply the selected visual style and verify**

  Use warm yellow/orange accents, dark blue text, rounded cards, stars, streak labels, and a four-item bottom navigation. Test at a narrow iPhone-sized viewport and remove any horizontal overflow.

- [ ] **Step 7: Run build and browser smoke checks, then commit**

  Run `npm run build`, start the Vite preview server, verify the four screens and a toggle in a mobile browser, then commit with `git add src && git commit -m "feat: add reward adventure screens"`.

### Task 4: Add monthly rollover, editing, and local backup/restore

**Files:**
- Modify: `src/domain/model.js`
- Modify: `src/domain/storage.js`
- Modify: `src/screens/SettingsScreen.jsx`
- Create: `src/components/BackupControls.jsx`
- Create: `tests/backup.test.mjs`

**Interfaces:**
- `rolloverIfNeeded(state, now)` archives the previous month once and creates the new month without clearing point balance.
- `exportBackup(state)` returns a JSON string with a schema version.
- `importBackup(json)` validates the schema and returns a complete state or a user-readable error.
- `BackupControls({state, onImport})` downloads a JSON backup and accepts a local JSON file.

- [ ] **Step 1: Write failing rollover and backup tests**

  Cover month transition without duplicate archives, carried-forward points, valid export/import round-trip, and rejection of malformed or incompatible JSON.

- [ ] **Step 2: Implement rollover and backup helpers**

  Keep the previous month immutable in the archive, create the next month’s empty daily record, preserve `pointsLedger`, and validate imports before replacing state.

- [ ] **Step 3: Wire settings UI**

  Add editable task/reward forms, archive view, export button, file import, and a confirmation step that states which months and record counts will be restored.

- [ ] **Step 4: Run tests and commit**

  Run `node --test tests/backup.test.mjs tests/domain.test.mjs`, then commit with `git add src tests && git commit -m "feat: add monthly rollover and local backup"`.

### Task 5: Verify PWA installation and offline behavior

**Files:**
- Modify: `public/manifest.webmanifest`
- Modify: `public/sw.js`
- Create: `tests/pwa-smoke.mjs`
- Modify: `README.md`

**Interfaces:**
- Manifest declares the app name, short name, standalone display, theme colors, and an icon fallback.
- Service worker precaches the built shell and serves cached same-origin assets offline.
- README explains local development, build, Safari “添加到主屏幕”, and JSON backup usage.

- [ ] **Step 1: Write the PWA smoke test**

  Assert the manifest includes the app name and standalone display, and the service worker contains install/fetch handlers.

- [ ] **Step 2: Run the test and verify the current implementation**

  Run `node --test tests/pwa-smoke.mjs`; fix any missing manifest or worker fields.

- [ ] **Step 3: Add README and final install guidance**

  Document `npm install`, `npm run dev`, `npm run build`, previewing the production bundle, Safari installation, and backup/restore behavior.

- [ ] **Step 4: Run the complete verification**

  Run `npm test`, `npm run build`, and a mobile browser smoke pass for initial load, task toggle, navigation, reward redemption, export, and reload persistence. Confirm no console errors and no horizontal overflow.

- [ ] **Step 5: Commit and push**

  Run `git add . && git commit -m "feat: complete reward adventure local pwa" && git push origin main`.

## Self-review checklist

- Spec coverage: Tasks 2–4 cover all default rules, calculations, monthly rollover, editing, rewards, and backup requirements; Tasks 1, 3, and 5 cover PWA installation, offline use, screen structure, and narrow-screen acceptance.
- Placeholder scan: no TBD, TODO, or unspecified implementation step is required by this plan.
- Type consistency: all screen props use `{state, monthKey, summary, dispatch}`; storage and backup APIs operate on the same versioned state object.
