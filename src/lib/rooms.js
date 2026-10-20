export const ROOMS = [
  { id: 'sort', name: 'Sorting Hall', sub: 'Arrays and sorting: bubble, selection, insertion, merge, quick' },
  { id: 'bsearch', name: 'Binary Vault', sub: 'Binary search: halve the sorted array to find the key' },
  { id: 'keep', name: 'The Keep', sub: 'Stacks, queues and linked lists: LIFO, FIFO, pointers' },
  { id: 'crypt', name: 'Root Crypt', sub: 'Binary search trees, traversals and min-heaps' },
  { id: 'maze', name: 'Graph Labyrinth', sub: 'Graphs: BFS, DFS and Dijkstra shortest paths' },
  { id: 'hash', name: 'Hash Forge', sub: 'Hash tables: buckets, collisions, chaining and linear probing' },
  { id: 'dp', name: 'DP Dungeon', sub: 'Dynamic programming: fill the table for coin change, LCS and knapsack' },
]
// Difficulty: life = extra goblin-lane tiles, xp = multiplier on round XP.
export const DIFFS = {
  easy: { label: 'Easy', life: 2, xp: 0.5, note: '+2 lives, half XP' },
  normal: { label: 'Normal', life: 0, xp: 1, note: 'standard lives and XP' },
  hard: { label: 'Hard', life: -1, xp: 1.5, note: '1 fewer life, 1.5x XP' },
}
export const RANKS = [
  [0, 'Squire'],
  [60, 'Warden'],
  [150, 'Knight'],
  [300, 'Archmage'],
  [500, 'Dungeon Master'],
]
