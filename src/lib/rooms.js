export const ROOMS = [
  { id: 'sort', name: 'Sorting Hall', sub: 'Arrays and sorting: bubble, selection, insertion, merge, quick' },
  { id: 'bsearch', name: 'Binary Vault', sub: 'Binary search: halve the sorted array to find the key' },
  { id: 'keep', name: 'The Keep', sub: 'Stacks, queues and linked lists: LIFO, FIFO, pointers' },
  { id: 'crypt', name: 'Root Crypt', sub: 'Binary search trees, traversals and min-heaps' },
  { id: 'maze', name: 'Graph Labyrinth', sub: 'Graphs: BFS, DFS and Dijkstra shortest paths' },
  { id: 'hash', name: 'Hash Forge', sub: 'Hash tables: buckets, collisions, chaining and linear probing' },
  { id: 'dp', name: 'DP Dungeon', sub: 'Dynamic programming: fill the table for coin change, LCS and knapsack' },
  { id: 'type', name: 'Scribe Tower', sub: 'Type real algorithms, or write the function and pass the tests' },
  { id: 'list', name: 'Linked List Lab', sub: 'Linked lists: reverse, delete and insert by rewiring pointers' },
  { id: 'bits', name: 'Bit Bunker', sub: 'Bit manipulation: AND, OR, XOR, shifts and one-line tricks' },
  { id: 'bigo', name: 'Big-O Blitz', sub: 'Timed arcade: name the complexity of each snippet before the clock runs out' },
  { id: 'window', name: 'Pattern Match', sub: 'Two pointers and sliding windows: one pass instead of brute force' },
  { id: 'memory', name: 'Memory Match', sub: 'Card flip: match each structure or algorithm with its signature trait' },
  { id: 'stackdef', name: 'Stack Defender', sub: 'Stacks in action: bracket matching and postfix evaluation' },
  { id: 'bug', name: 'Bug Hunt', sub: 'Spot the one buggy line in short functions: off-by-ones, flipped checks' },
  { id: 'trie', name: 'Trie Tunnel', sub: 'Tries: share prefixes, count new nodes and answer prefix queries' },
  { id: 'union', name: 'Union Yard', sub: 'Union-Find: merge groups, follow parents to the root, count components' },
  { id: 'back', name: 'Backtrack Bastion', sub: 'Backtracking: N-Queens and subset sum, try a choice and undo dead ends' },
  { id: 'heap', name: 'Heap Hollow', sub: 'Heaps: build a min- or max-heap with bottom-up sift-down' },
  { id: 'graphb', name: 'Graph Builder', sub: 'Weighted graphs: build Dijkstra shortest paths and Kruskal spanning trees' },
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
  [800, 'Algorithm Sage'],
  [1200, 'Grandmaster'],
]
