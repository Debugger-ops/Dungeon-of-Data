# Dungeon of Data

A tower-defense dungeon game for learning DSA: sorting, binary search, stacks, queues, linked lists, BSTs, heaps, and graphs (BFS, DFS, Dijkstra). Built with React 18 and Vite, no other runtime dependencies.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

## Layout

| Path | What it holds |
|---|---|
| `src/lib/algos.js` | Sorting frame generator (bubble, selection, insertion, merge, quick), `minSwaps`, `inv` |
| `src/lib/tree.js` | BST insert, insertion-path explainer, tree layout, traversals |
| `src/lib/graph.js` | Graph data, BFS / DFS / Dijkstra simulators |
| `src/progress.jsx` | XP, stars, history; saved to localStorage; also view routing |
| `src/hooks.js` | `useRound`: goblin lane, message, result card for one round |
| `src/components/` | `Lane`, `Bars`, `TreeSvg`, `GraphSvg`, `Charts`, `Result`, `Room` |
| `src/rooms/` | One file per room (Sorting Hall, Binary Vault, The Keep, Root Crypt, Graph Labyrinth, Hash Forge) |
| `src/Daily.jsx` | Daily challenge: one room per day, date-seeded puzzle, streak and XP bonus |
| `src/Quiz.jsx`, `src/lib/quiz.js` | 6-question quiz weighted toward your weakest rooms (42-question bank) |
| `src/lib/achievements.js` | 13 achievements, checked after every round and quiz |
| `src/Tome.jsx`, `src/Ledger.jsx` | Big-O chart and tables, progress charts |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build in `dist/` (includes the offline service worker) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright). First time: `npx playwright install chromium` |
| `npm run test:all` | Both |

## Deploy

`.github/workflows/ci.yml` runs the unit and browser tests on every push and pull request. On pushes to `main` it then publishes `dist/` to GitHub Pages. One-time setup: in the repo go to Settings > Pages and set Source to "GitHub Actions". The site appears at `https://<your-username>.github.io/<repo>/`.

## Features added

- **DP Dungeon** room: fill the table for coin change, longest common subsequence and 0/1 knapsack.
- **Settings**: dark / light / match-system theme, larger text, sound effects with volume. Hint buttons (Hash Forge, Binary Vault, The Keep, DP Dungeon) cap that round at 2 stars.
- **Installable and offline**: web app manifest, icons and a service worker (production build only).
- **Tests**: Vitest unit tests for the algorithm, DP, quiz, progress and profile logic; Playwright tests for the main flows.

- **Hash Forge** room: chaining and linear probing. **Root Crypt** gains a heap extract-min (sift down) mode.
- **Difficulty** (map screen): Easy +2 lives and half XP, Normal, Hard 1 fewer life and 1.5x XP.
- **Daily challenge** with streaks and bonus XP (always plays on Normal).
- **Achievements** with toasts, listed in the Ledger.
- **Analytics** page: mastery radar, XP trend, activity heatmap, rolling accuracy, and an Algorithm lab with measured sorting counts, BST height and hash-probe curves (log-log charts with hover).
- **Local profiles**: create, switch and delete named profiles (colour avatar, optional PIN). Each keeps its own progress; progress saved before this feature becomes "Player 1". Stored in this browser only; a PIN is a lock screen, not encryption. Cloud sync would need a backend (Supabase or Firebase).
- **Scholar's Quiz**, and **export / import / reset** of progress as JSON in the Ledger.
# Dungeon-of-Data
