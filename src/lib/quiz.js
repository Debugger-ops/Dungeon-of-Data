import { ROOMS } from './rooms'
import { shuffle } from './util'

// [room, question, correct answer, three wrong answers, explanation]
const BANK = [
  ['sort', 'What is the worst-case time of quicksort that always picks the first element as pivot?', 'O(n²)', ['O(n log n)', 'O(n)', 'O(log n)'], 'On an already sorted array the pivot is always the minimum, so each partition peels off one element: n + (n-1) + ... = O(n²).'],
  ['sort', 'Which of these sorts is stable and O(n log n) in the worst case?', 'Merge sort', ['Quicksort', 'Heap sort', 'Selection sort'], 'Merge sort keeps equal items in order when merging and always splits evenly. Quicksort and heap sort are not stable.'],
  ['sort', 'What is the best-case time of insertion sort?', 'O(n)', ['O(n log n)', 'O(n²)', 'O(1)'], 'On an already sorted array each element is compared once and never shifted, so one pass is enough.'],
  ['sort', 'At most how many swaps does selection sort make on n elements?', 'n - 1', ['n²', 'n log n', '1'], 'It performs one swap per position to place the minimum, and the last position is placed for free.'],
  ['sort', 'What is the minimum number of swaps (of any two elements) to sort [2, 1, 4, 3]?', '2', ['1', '3', '4'], 'Minimum swaps = n minus the number of cycles. The permutation has two 2-cycles, so 4 - 2 = 2.'],
  ['sort', 'How many inversions does [3, 1, 2] have?', '2', ['1', '3', '0'], 'The inverted pairs are (3,1) and (3,2). Insertion sort and bubble sort do exactly one adjacent swap per inversion.'],
  ['sort', 'Bubble sort with an early-exit flag runs on an already sorted array. Its time is:', 'O(n)', ['O(n²)', 'O(log n)', 'O(n log n)'], 'The first pass makes no swaps, so the flag stops the algorithm after n - 1 comparisons.'],
  ['bsearch', 'What is the maximum number of guesses binary search needs on 64 sorted items?', '7', ['6', '8', '32'], 'floor(log2 64) + 1 = 7.'],
  ['bsearch', 'What does binary search require of its input?', 'Sorted data with random access', ['Unique values only', 'A power-of-two length', 'Data stored in a linked list'], 'Sorting lets one comparison rule out half the range, and random access lets you jump to the middle in O(1).'],
  ['bsearch', 'About how many comparisons does binary search need for 1,000,000 sorted items at most?', '20', ['10', '1,000', '500,000'], 'floor(log2 1,000,000) + 1 = 19 + 1 = 20.'],
  ['bsearch', 'Why write mid = lo + (hi - lo) / 2 instead of (lo + hi) / 2?', 'lo + hi can overflow a fixed-width integer', ['It runs faster', 'It rounds toward the higher index', 'It works on unsorted arrays'], 'For very large indexes lo + hi can exceed the integer limit. lo + (hi - lo) / 2 never does.'],
  ['bsearch', 'Binary search on a sorted singly linked list takes about:', 'O(n), because reaching the middle takes O(n)', ['O(log n)', 'O(1)', 'O(n log n)'], 'Each halving step still needs a walk to the middle node, so the total cost is n/2 + n/4 + ... = O(n).'],
  ['bsearch', 'You open tile index 5 and the key is higher. What do you discard?', 'Index 5 and everything below it', ['Everything above index 5', 'Only index 5', 'Nothing yet'], 'The array is sorted, so every tile at or below a too-low value is also too low.'],
  ['bsearch', 'Doubling the number of sorted items adds at most how many binary search guesses?', 'One', ['Double', 'n', 'log n'], 'log2(2n) = log2 n + 1.'],
  ['keep', 'Push 1, push 2, push 3, then pop on a stack. What is returned?', '3', ['1', '2', 'Nothing, the stack is empty'], 'A stack is LIFO: the most recently pushed item leaves first.'],
  ['keep', 'Enqueue a, b, c and then dequeue. What comes out?', 'a', ['c', 'b', 'Nothing'], 'A queue is FIFO: the item that has waited longest leaves first.'],
  ['keep', 'Reversing a singly linked list in place uses how much extra space?', 'O(1)', ['O(n)', 'O(log n)', 'O(n²)'], 'Three pointers (prev, curr, next) are enough no matter how long the list is.'],
  ['keep', 'Which structure best fits an undo history?', 'Stack', ['Queue', 'Hash table', 'Binary search tree'], 'Undo reverses the most recent action first, which is last in, first out.'],
  ['keep', 'Which structure is the natural choice for checking matching brackets?', 'Stack', ['Queue', 'Min-heap', 'Graph'], 'Each closing bracket must match the most recent unmatched opening bracket.'],
  ['keep', 'What is the cost of inserting at the head of a singly linked list?', 'O(1)', ['O(n)', 'O(log n)', 'O(n log n)'], 'Point the new node at the old head and update the head pointer. Nothing is shifted.'],
  ['keep', 'Reading the k-th element of a linked list costs:', 'O(k)', ['O(1)', 'O(log k)', 'O(k²)'], 'You must follow k pointers from the head. Arrays do this in O(1).'],
  ['crypt', 'An in-order traversal of a binary search tree visits keys in what order?', 'Ascending', ['Descending', 'Level by level', 'Insertion order'], 'Left subtree, node, right subtree: smaller keys come first at every node.'],
  ['crypt', 'What is the height of a balanced BST with n nodes?', 'O(log n)', ['O(n)', 'O(1)', 'O(n log n)'], 'Each level roughly doubles the node count, so about log2 n levels hold n nodes.'],
  ['crypt', 'You insert 1, 2, 3, 4, 5 in that order into an empty plain BST. The tree becomes:', 'A chain with height n', ['A perfectly balanced tree', 'A tree with height log n', 'Two equal halves'], 'Each key is larger than all before it, so it always goes right. Search degrades to O(n).'],
  ['crypt', 'Where is the smallest value in a min-heap?', 'At the root', ['At the last leaf', 'At the left-most leaf', 'It depends on insertion order'], 'Every parent is no larger than its children, so the root is the minimum. Peeking is O(1).'],
  ['crypt', 'In a 0-indexed array heap, the parent of index i is at:', 'floor((i - 1) / 2)', ['2i + 1', 'i / 2 + 1', 'i - 1'], 'Children of i sit at 2i + 1 and 2i + 2, so the parent is floor((i - 1) / 2).'],
  ['crypt', 'What is the time to extract the minimum from a binary min-heap?', 'O(log n)', ['O(1)', 'O(n)', 'O(n log n)'], 'Moving the last item to the root and sifting down touches at most one node per level.'],
  ['crypt', 'A pre-order traversal visits nodes in which order?', 'Node, left, right', ['Left, node, right', 'Left, right, node', 'Right, node, left'], 'Pre means the node comes before its subtrees.'],
  ['maze', 'In an unweighted graph, BFS from a source finds the path with the fewest:', 'Edges', ['Vertices revisited', 'Weights', 'Cycles'], 'BFS expands in layers, so the first time it reaches a vertex is by a path with the fewest edges.'],
  ['maze', 'Dijkstra can give wrong answers when the graph has:', 'Negative edge weights', ['Cycles', 'Directed edges', 'More than 100 vertices'], 'Dijkstra assumes a finalized vertex cannot be improved later, which negative edges break. Use Bellman-Ford.'],
  ['maze', 'Which data structure drives BFS?', 'Queue', ['Stack', 'Min-heap', 'Hash table'], 'A FIFO queue gives the layer-by-layer order. DFS uses a stack or recursion.'],
  ['maze', 'BFS or DFS on an adjacency list takes:', 'O(V + E)', ['O(V²)', 'O(E log V)', 'O(V · E)'], 'Each vertex is visited once and each edge is examined a constant number of times.'],
  ['maze', 'Dijkstra with a binary heap runs in:', 'O((V + E) log V)', ['O(V + E)', 'O(V · E)', 'O(V³)'], 'Each edge can cause one heap update costing O(log V).'],
  ['maze', 'An adjacency matrix for V vertices uses:', 'O(V²) space', ['O(V + E) space', 'O(V) space', 'O(E) space'], 'It stores a cell for every vertex pair, whether or not an edge exists.'],
  ['maze', 'Which traversal is the usual tool for topological sorting and cycle detection?', 'DFS', ['BFS', 'Binary search', 'Dijkstra'], 'DFS finish times give a topological order, and a back edge reveals a cycle.'],
  ['hash', 'A hash table lookup takes what time on average?', 'O(1)', ['O(log n)', 'O(n)', 'O(n log n)'], 'A good hash spreads keys evenly, so each bucket holds a constant number of items on average.'],
  ['hash', 'What is a collision?', 'Two different keys hash to the same bucket', ['A key is missing', 'The table is empty', 'Two equal keys are stored twice'], 'Collisions are unavoidable when keys outnumber buckets, so every table needs a strategy for them.'],
  ['hash', 'The load factor of a hash table is:', 'items / buckets', ['buckets / items', 'items - buckets', 'collisions / items'], 'α = n / m. Average chain length under chaining is α.'],
  ['hash', 'If every key hashes to the same bucket, lookup costs:', 'O(n)', ['O(1)', 'O(log n)', 'O(n²)'], 'The table degenerates into one long list that you must scan.'],
  ['hash', 'Linear probing suffers mainly from:', 'Primary clustering', ['Pointer overhead', 'Needing sorted keys', 'Unbounded recursion'], 'Runs of occupied slots grow, and any key landing in a run extends it further.'],
  ['hash', 'Separate chaining resolves a collision by:', 'Storing colliding keys in a list at that bucket', ['Overwriting the old key', 'Probing the next free slot', 'Rehashing the whole table'], 'Each bucket holds a small list, so the table can hold more items than buckets.'],
  ['hash', 'Why do hash tables usually double their size when the load factor gets high?', 'To keep chains or probe runs short', ['To sort the keys', 'To remove duplicates', 'To reduce memory'], 'Growing and rehashing is O(n) occasionally but amortizes to O(1) per insert.'],
  ['hash', 'Why can you not just empty a slot when deleting from a linear-probing table?', 'It could break the probe path of other keys', ['It frees too much memory', 'Hash functions forbid it', 'Deletes are not supported'], 'A later key may have probed past that slot. A tombstone marker keeps lookups correct.'],
]

export const QUIZ_LEN = 6

// Chance of picking a room grows as your accuracy there falls. Unplayed rooms get a medium weight.
export function roomWeights(S) {
  return ROOMS.map((r) => {
    const x = S.rooms[r.id]
    const t = x.ok + x.bad
    const acc = t ? x.ok / t : null
    return { id: r.id, name: r.name, acc, w: acc === null ? 1.5 : 1 + (1 - acc) * 3 }
  })
}

export function buildQuiz(S) {
  const weights = roomWeights(S)
  const pools = Object.fromEntries(ROOMS.map((r) => [r.id, shuffle(BANK.filter((q) => q[0] === r.id))]))
  const out = []
  while (out.length < QUIZ_LEN) {
    const live = weights.filter((w) => pools[w.id].length)
    if (!live.length) break
    let pick = Math.random() * live.reduce((a, w) => a + w.w, 0)
    let room = live[live.length - 1]
    for (const w of live) {
      pick -= w.w
      if (pick <= 0) {
        room = w
        break
      }
    }
    const [r, q, good, bad, why] = pools[room.id].pop()
    const opts = shuffle([good, ...bad])
    out.push({ room: r, q, opts, answer: opts.indexOf(good), why })
  }
  return out
}
export const BANK_SIZE = BANK.length
