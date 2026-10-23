// Level-wise campaign: 4 worlds of 5 levels. A level is a fixed puzzle (seeded by its id) in one room and mode,
// played at a set difficulty. Clearing a level (1+ stars) unlocks the next one.
const L = (n, name, room, mode, diff, tip) => ({ n, name, room, mode, diff, tip })

export const WORLDS = [
  {
    id: 1, name: 'Array Plains', blurb: 'Hashing, searching and sorting: the basics every other structure builds on.',
    levels: [
      L(1, 'First Forge', 'hash', 'chain', 'easy', 'Key mod 7 tells you the bucket.'),
      L(2, 'Halve It', 'bsearch', 'v', 'easy', 'Always guess the middle tile.'),
      L(3, 'Sort Skirmish', 'sort', 'play', 'normal', 'Predict each swap before you click.'),
      L(4, 'Bit Bunker Gate', 'bits', 'ops', 'normal', 'Read the inputs as binary, bit by bit.'),
      L(5, 'Boss: Big-O Blitz', 'bigo', 'blitz', 'normal', 'Loops multiply when nested and add when sequential.'),
    ],
  },
  {
    id: 2, name: 'Linked Marches', blurb: 'Pointers, stacks and queues: order of operations is everything.',
    levels: [
      L(1, 'Snip the Node', 'list', 'delete', 'easy', 'Rewire the node before the target.'),
      L(2, 'Stack and Queue', 'keep', 'sq', 'normal', 'LIFO for stacks, FIFO for queues.'),
      L(3, 'Bracket Guard', 'stackdef', 'brackets', 'normal', 'Push openers, pop on a match, reject on a mismatch.'),
      L(4, 'Flip the Chain', 'list', 'reverse', 'normal', 'Save next before you change curr.next.'),
      L(5, 'Boss: Postfix Engine', 'stackdef', 'postfix', 'hard', 'Second-from-top comes first in the operator.'),
    ],
  },
  {
    id: 3, name: 'Tree and Graph Highlands', blurb: 'Hierarchies and networks: traversals, heaps and shortest paths.',
    levels: [
      L(1, 'Plant the Tree', 'crypt', 'bst', 'normal', 'Smaller goes left, larger goes right.'),
      L(2, 'Walk the Branches', 'crypt', 'trav', 'normal', 'In-order is left, node, right.'),
      L(3, 'Breadth First', 'maze', 'bfs', 'normal', 'Level by level using a queue.'),
      L(4, 'Heap Peak', 'crypt', 'heap', 'hard', 'Bubble the new value up while it is smaller than its parent.'),
      L(5, 'Boss: Dijkstra Run', 'maze', 'dij', 'hard', 'Always settle the closest unsettled node.'),
    ],
  },
  {
    id: 4, name: 'Dynamic Depths', blurb: 'Reuse sub-answers, think in patterns and ship working code.',
    levels: [
      L(1, 'Coin Table', 'dp', 'coin', 'normal', 'dp[x] = 1 + min(dp[x - coin]).'),
      L(2, 'Two Pointers', 'window', 'two', 'normal', 'Too small moves left up, too big moves right down.'),
      L(3, 'Cheapest Network', 'graphb', 'kruskal', 'hard', 'Skip any edge that would close a cycle.'),
      L(4, 'Bug Hunt', 'bug', 'hunt', 'hard', 'Check boundaries and flipped comparisons first.'),
      L(5, 'Final Boss: Write It', 'type', 'write', 'hard', 'Run the tests early and often.'),
    ],
  },
  {
    id: 5, name: 'Forgotten Catacombs', blurb: 'Prefix trees and disjoint sets: the structures behind autocomplete and networks.',
    levels: [
      L(1, 'First Letters', 'trie', 'insert', 'easy', 'Shared prefixes cost nothing: count only the letters that are new.'),
      L(2, 'Merge the Clans', 'union', 'count', 'normal', 'A union of two already-joined nodes changes nothing.'),
      L(3, 'Autocomplete', 'trie', 'prefix', 'normal', 'Count the words that begin with the prefix.'),
      L(4, 'Find the Chief', 'union', 'find', 'hard', 'Follow parent links until a node is its own parent.'),
      L(5, 'Boss: Knapsack Vault', 'dp', 'knap', 'hard', 'Each cell is the best of skipping or taking the item.'),
    ],
  },
]

export const LEVELS = WORLDS.flatMap((w) => w.levels.map((l) => ({ ...l, id: `${w.id}-${l.n}`, world: w.id, worldName: w.name })))
export const levelById = (id) => LEVELS.find((l) => l.id === id)
export const nextLevel = (id) => LEVELS[LEVELS.findIndex((l) => l.id === id) + 1] || null
export const clearedCount = (stars) => LEVELS.filter((l) => (stars[l.id] || 0) >= 1).length
export const totalStars = (stars) => LEVELS.reduce((t, l) => t + (stars[l.id] || 0), 0)
// A level is open when it is the first one or the previous level has at least one star.
export const isOpen = (id, stars) => {
  const i = LEVELS.findIndex((l) => l.id === id)
  return i === 0 || (i > 0 && (stars[LEVELS[i - 1].id] || 0) >= 1)
}
export const worldDone = (w, stars) => w.levels.every((l) => (stars[`${w.id}-${l.n}`] || 0) >= 1)
