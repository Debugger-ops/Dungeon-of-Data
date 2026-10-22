import { shuffle } from './util'

export const PAIRS = [
  ['Stack', 'LIFO'], ['Queue', 'FIFO'], ['Binary search', 'O(log n) on sorted data'], ['Hash table', 'O(1) average lookup'],
  ['BFS', 'Explores level by level'], ['DFS', 'Dives deep, then backtracks'], ['Merge sort', 'Stable, always O(n log n)'], ['Min-heap', 'Parent is smaller than its children'],
  ['BST in-order', 'Visits keys in sorted order'], ['Dijkstra', 'Shortest paths, non-negative weights'], ['Linked list', 'O(n) search, O(1) insert at head'], ['Quicksort', 'O(n²) worst case'],
  ['Topological sort', 'Orders the nodes of a DAG'], ['Trie', 'Prefix lookups'], ['Union-Find', 'Tracks connected components'], ['Memoization', 'Caches sub-problem answers'],
]

// n pairs shuffled into 2n cards. Each card knows which pair it belongs to.
export function deal(n = 8) {
  const picked = shuffle(PAIRS).slice(0, n)
  const cards = picked.flatMap(([a, b], i) => [
    { id: `${i}a`, pair: i, text: a, kind: 'term' },
    { id: `${i}b`, pair: i, text: b, kind: 'def' },
  ])
  return shuffle(cards)
}
