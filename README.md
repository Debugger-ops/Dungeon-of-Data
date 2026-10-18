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

## Features added

- **Hash Forge** room: chaining and linear probing. **Root Crypt** gains a heap extract-min (sift down) mode.
- **Difficulty** (map screen): Easy +2 lives and half XP, Normal, Hard 1 fewer life and 1.5x XP.
- **Daily challenge** with streaks and bonus XP (always plays on Normal).
- **Achievements** with toasts, listed in the Ledger.
- **Scholar's Quiz**, and **export / import / reset** of progress as JSON in the Ledger.
# Dungeon-of-Data
