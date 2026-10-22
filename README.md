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

## Games, modes and levels

- 16 rooms: Hash Forge, Sorting Gym, Binary Search, Crypt (BST/traversal/heap), Maze (BFS/Dijkstra), Stack/Queue, DP Dungeon, Scribe Tower, plus Linked List Lab, Bit Bunker, Big-O Blitz, Pattern Match, Memory Match, Stack Defender, Bug Hunt and Graph Builder.
- **Campaign**: 4 worlds x 5 levels. Each level is a fixed puzzle (same on retry), unlocks the next, and saves 1-3 stars with an XP bonus.
- **Boss Rush**: three random rooms back to back; clear all three for a bonus.
- **Daily**: one seeded puzzle per day.
- Responsive from 360px phones up; tested for overflow and tap targets.

## Features added

- **Hash Forge** room: chaining and linear probing. **Root Crypt** gains a heap extract-min (sift down) mode.
- **Difficulty** (map screen): Easy +2 lives and half XP, Normal, Hard 1 fewer life and 1.5x XP.
- **Daily challenge** with streaks and bonus XP (always plays on Normal).
- **Achievements** with toasts, listed in the Ledger.
- **Analytics** page: mastery radar, XP trend, activity heatmap, rolling accuracy, and an Algorithm lab with measured sorting counts, BST height and hash-probe curves (log-log charts with hover).
- **Local profiles**: create, switch and delete named profiles (colour avatar, optional PIN). Each keeps its own progress; progress saved before this feature becomes "Player 1". Stored in this browser only; a PIN is a lock screen, not encryption. Cloud sync would need a backend (Supabase or Firebase).
- **Scholar's Quiz**, and **export / import / reset** of progress as JSON in the Ledger.
# Dungeon-of-Data
