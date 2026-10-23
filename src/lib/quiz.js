import { ROOMS } from './rooms'
import { hashStr, shuffle } from './util'

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
  ['dp', 'What are the two properties that make a problem suited to dynamic programming?', 'Overlapping subproblems and optimal substructure', ['Sorted input and random access', 'A tree shape and unique keys', 'Small input size and no recursion'], 'Optimal substructure lets you build the answer from sub-answers, and overlap means the same sub-answers are needed repeatedly, so storing them pays off.'],
  ['dp', 'Memoization differs from tabulation in that memoization is:', 'Top-down: recursion that caches results', ['Bottom-up: filling a table in order', 'Always faster', 'Only for graphs'], 'Memoization starts from the big problem and caches sub-results as it recurses. Tabulation fills the table from the base cases up.'],
  ['dp', 'Naive recursive Fibonacci takes exponential time. With memoization it takes:', 'O(n)', ['O(log n)', 'O(n²)', 'O(1)'], 'Each of the n distinct subproblems is computed once and then looked up.'],
  ['dp', 'Fewest coins for amount 6 with coins {1, 3, 4} is:', '2', ['3', '1', '6'], 'Use 3 + 3. Greedy would take 4 + 1 + 1 = 3 coins, which is why greedy fails here.'],
  ['dp', 'The longest common subsequence table for strings of length n and m has what time cost to fill?', 'O(n x m)', ['O(n + m)', 'O(n log m)', 'O(2^n)'], 'There are (n+1)(m+1) cells and each takes constant time from its neighbours.'],
  ['dp', 'In 0/1 knapsack, "0/1" means:', 'Each item is taken whole or not at all', ['Items have weight 0 or 1', 'The value is 0 or 1', 'The capacity is 0 or 1'], 'You cannot split an item, so each cell compares skipping versus taking it.'],
  ['dp', 'In an LCS table, when the two current characters match, dp[i][j] equals:', 'dp[i-1][j-1] + 1', ['max(dp[i-1][j], dp[i][j-1])', 'dp[i-1][j] + dp[i][j-1]', '0'], 'A matching pair extends the best subsequence of both shorter prefixes by one.'],
  ['trie', 'How many nodes does a trie holding "car", "cat" and "cart" have (not counting the root)?', '5', ['7', '9', '3'], 'c, a, then r, t under a, then t under r: 5 nodes. Shared prefixes are stored once.'],
  ['trie', 'Looking up a word of length L in a trie takes:', 'O(L)', ['O(n) for n stored words', 'O(log n)', 'O(L²)'], 'You follow one node per letter, no matter how many words are stored.'],
  ['trie', 'Which feature is a trie naturally good at compared with a hash table?', 'Finding every key with a given prefix', ['Exact-key lookup', 'Counting keys', 'Deleting keys'], 'The prefix leads to one subtree that holds exactly the matching words.'],
  ['trie', 'Why does a trie mark some nodes as word ends?', 'A word can be a prefix of another word', ['To sort the letters', 'To balance the tree', 'To save memory'], '"do" and "dog" share a path, so the node for "o" must say that "do" is itself a word.'],
  ['trie', 'The main cost of a trie is:', 'Memory for many child pointers', ['Slow lookups', 'Needing sorted input', 'Unbounded recursion'], 'Each node may hold a link per alphabet letter, which can use a lot of space for sparse data.'],
  ['union', 'What does find(x) return in Union-Find?', 'The root (representative) of the group containing x', ['The size of the group', 'The parent of x only', 'The number of groups'], 'You follow parent links until a node is its own parent.'],
  ['union', 'Starting with 6 separate items, how many groups remain after union(0,1), union(2,3) and union(1,0)?', '4', ['3', '5', '2'], 'The first two unions merge pairs (6 → 4). The third joins items already together, so nothing changes.'],
  ['union', 'Path compression speeds up Union-Find by:', 'Pointing visited nodes straight at the root', ['Sorting the nodes', 'Deleting small groups', 'Using a hash table'], 'After a find, later finds on those nodes take one step.'],
  ['union', 'Kruskal\'s algorithm uses Union-Find to:', 'Reject edges that would form a cycle', ['Sort the edges', 'Find shortest paths', 'Colour the graph'], 'If both endpoints already have the same root, the edge would close a cycle.'],
  ['union', 'With union by rank and path compression, each operation costs about:', 'Nearly O(1) (inverse Ackermann)', ['O(n)', 'O(log n) always', 'O(n log n)'], 'The amortized cost grows so slowly it is below 5 for any realistic input.'],
  ['back', 'Backtracking is best described as:', 'Depth-first search that abandons a partial solution once it cannot work', ['Breadth-first search over every state', 'Sorting then scanning', 'Greedy choices that are never undone'], 'It builds a candidate step by step and undoes (backtracks) a step as soon as the branch is a dead end.'],
  ['back', 'In N-Queens, a new queen is unsafe if another queen shares its:', 'Column or diagonal', ['Row only', 'Colour only', 'Neighbouring square only'], 'Rows are handled by placing one queen per row, so only columns and both diagonals need checking.'],
  ['back', 'What does pruning mean in backtracking?', 'Skipping branches that cannot lead to a valid solution', ['Deleting the input', 'Sorting the choices', 'Caching every answer'], 'The earlier a dead end is detected, the less of the search tree is explored.'],
  ['back', 'The number of subsets of an n-item set, which bounds a naive subset-sum search, is:', '2^n', ['n²', 'n!', 'n log n'], 'Each item is taken or skipped, so there are 2 choices per item.'],
  ['heap', 'Building a binary heap from n items with bottom-up heapify takes:', 'O(n)', ['O(n log n)', 'O(log n)', 'O(n²)'], 'Most nodes are near the bottom and sift only a short way, so the total work sums to O(n).'],
  ['heap', 'In bottom-up heapify you start sifting down from:', 'The last parent node', ['The root', 'The last leaf', 'A random node'], 'Leaves are already heaps. The last parent is at index floor(n/2) - 1.'],
  ['heap', 'In a max-heap each parent is:', 'At least as large as its children', ['Smaller than its children', 'Equal to its siblings', 'Larger than every node in the tree'], 'Only the parent-child relation is ordered, not siblings or cousins.'],
  ['heap', 'Heap sort runs in:', 'O(n log n), in place', ['O(n), in place', 'O(n²)', 'O(n log n) with O(n) extra space'], 'Build a max-heap, then repeatedly swap the root to the end and sift down.'],
  ['type', 'Which data structure checks balanced brackets in O(n)?', 'A stack', ['A queue', 'A hash set', 'A sorted array'], 'Push each opener; each closer must match the most recent unmatched opener, which is exactly last-in, first-out.'],
  ['type', 'In the Fibonacci challenge, why does naive recursion time out at fib(45)?', 'It recomputes the same subproblems exponentially many times', ['It runs out of memory for the array', 'JavaScript numbers overflow', 'The loop never ends'], 'fib(n) calls fib(n-1) and fib(n-2), so the work roughly doubles with n. Memoization or a loop makes it O(n).'],
  ['type', 'Two Sum in O(n) uses which idea?', 'Store seen values in a hash map and look up target minus current', ['Sort and use two nested loops', 'Binary search every pair', 'Recursion on halves'], 'For each x you only need to know whether target - x appeared earlier, which a hash map answers in O(1).'],
  ['type', 'The height of an empty tree (null) is usually defined as:', '0', ['1', '-1 in every case', 'undefined'], 'It is the base case: height(node) = 1 + max(height(left), height(right)), and null contributes 0 levels.'],
  ['list', 'To delete a node from a singly linked list you must change the pointer of:', 'The node before it', ['The node itself', 'The tail only', 'Every node'], 'Only the previous node points at it, so prev.next = prev.next.next skips it. Deleting the head moves the head pointer.'],
  ['list', 'When reversing a linked list, why do you save curr.next before pointing curr at prev?', 'Otherwise the rest of the list is lost', ['To make the loop faster', 'To keep the list sorted', 'Because null is not allowed'], 'Once curr.next is overwritten there is no other reference to the remaining nodes.'],
  ['bits', 'What does x & (x - 1) do?', 'Clears the lowest set bit', ['Sets the lowest bit', 'Flips every bit', 'Doubles x'], 'Subtracting 1 flips the lowest 1 and the zeros below it, so the AND removes that lowest 1.'],
  ['bits', 'What is 5 << 2 (shift left by 2)?', '20', ['10', '7', '3'], 'Shifting left by k multiplies by 2^k: 5 x 4 = 20.'],
  ['bigo', 'A loop where the counter doubles each time (i *= 2) up to n runs:', 'O(log n)', ['O(n)', 'O(n log n)', 'O(2ⁿ)'], 'Doubling reaches n after log2(n) steps.'],
  ['bigo', 'Two nested loops that each run n times take:', 'O(n²)', ['O(2n)', 'O(n)', 'O(n log n)'], 'The inner loop runs n times for every one of the outer n iterations.'],
  ['window', 'On a sorted array, two pointers finds a pair with a given sum in:', 'O(n)', ['O(n²)', 'O(log n)', 'O(n log n)'], 'Each pointer only moves inwards, so there are at most n moves in total.'],
  ['window', 'Moving a sliding window one step right, the new sum is:', 'old sum - leaving + entering', ['old sum + entering', 'old sum x entering', 'recomputed from scratch'], 'Only one value leaves and one enters, so the update is O(1).'],
  ['memory', 'Which structure is LIFO (last in, first out)?', 'Stack', ['Queue', 'Heap', 'Hash table'], 'The most recently pushed item is the first one popped.'],
  ['memory', 'Which of these gives O(1) average lookup by key?', 'Hash table', ['Linked list', 'Sorted array', 'Binary search tree (unbalanced)'], 'A good hash function sends a key straight to its bucket.'],
  ['stackdef', 'In postfix notation, what does the expression 3 4 + 2 * evaluate to?', '14', ['10', '11', '24'], '3 4 + gives 7, then 7 2 * gives 14. Postfix needs no brackets.'],
  ['stackdef', 'Which structure checks that brackets are balanced?', 'A stack', ['A queue', 'A set', 'A heap'], 'The most recent opener must be closed first, which is last-in, first-out.'],
  ['bug', 'A loop for (i = 0; i <= a.length; i++) reading a[i] has which common bug?', 'Off-by-one: it reads past the end', ['It never runs', 'It skips the first element', 'It sorts the array'], 'Valid indexes are 0 to a.length - 1, so <= goes one too far.'],
  ['bug', 'A recursive function never stops for input 0 because the base case checks n === 1. The fix is:', 'Use n <= 1 as the base case', ['Use a loop counter', 'Check n === 2', 'Add a second argument'], 'The recursion must reach a base case for every input it can receive.'],
  ['graphb', 'Dijkstra always finalizes next the node with:', 'The smallest tentative distance', ['The most edges', 'The lowest label', 'The largest weight'], 'The closest unfinished node cannot be improved by a longer route (with non-negative weights).'],
  ['graphb', 'Kruskal skips an edge when:', 'Its endpoints are already connected', ['It is the cheapest', 'It has weight 1', 'It touches the start node'], 'Adding it would close a cycle, and a spanning tree has none.'],
  ['list', 'Why is inserting at the head of a singly linked list O(1)?', 'Only the head pointer and one new link change', ['The list is sorted', 'Arrays are used underneath', 'It copies nothing but scans once'], 'Create the node, point it at the old head, then move the head pointer. No shifting is needed, unlike an array.'],
  ['list', 'What is the time to find a value in an unsorted singly linked list?', 'O(n)', ['O(1)', 'O(log n)', 'O(n log n)'], 'You can only follow next pointers from the head, so you may have to visit every node.'],
  ['list', 'Inserting a node after prev needs two pointer updates. In which order?', 'new.next = prev.next, then prev.next = new', ['prev.next = new, then new.next = prev.next', 'Either order works', 'new.next = null first'], 'If you overwrite prev.next first, you lose the only reference to the rest of the list.'],
  ['list', 'Which is easier to do in O(1) given a pointer to the node: delete in a singly or a doubly linked list?', 'Doubly linked', ['Singly linked', 'They are the same', 'Neither'], 'A doubly linked node knows its previous node, so it can unlink itself. A singly linked list needs to find the previous node first.'],
  ['bits', 'How many 1 bits does 13 (1101 in binary) have?', '3', ['2', '4', '1'], '1101 has three 1s. Counting set bits is called popcount.'],
  ['bits', 'What does x ^ x equal for any x?', '0', ['x', '1', '2x'], 'XOR sets a bit when the inputs differ, and a number never differs from itself.'],
  ['bits', 'How can you test whether n is odd using bits?', 'n & 1', ['n >> 1', 'n | 1', 'n ^ 1'], 'The lowest bit is 1 exactly for odd numbers.'],
  ['bits', 'What does x >> 1 do for a non-negative integer x?', 'Divides by 2, rounding down', ['Multiplies by 2', 'Flips all bits', 'Adds 1'], 'Every bit moves one place down, which halves the value and drops the lowest bit.'],
  ['bigo', 'Which time is usually the best you can do to sort n items using comparisons?', 'O(n log n)', ['O(n)', 'O(log n)', 'O(n²)'], 'A comparison sort must distinguish n! orderings, which needs about n log n comparisons.'],
  ['bigo', 'A naive recursive fib(n) that calls fib(n-1) and fib(n-2) takes about:', 'O(2ⁿ)', ['O(n)', 'O(n²)', 'O(log n)'], 'The number of calls roughly doubles with each extra level.'],
  ['bigo', 'What is the time of a loop followed by another loop, each running n times?', 'O(n)', ['O(n²)', 'O(2ⁿ)', 'O(log n)'], 'Sequential work adds: n + n = 2n, and constants are dropped.'],
  ['bigo', 'Reading a[0] from an array takes:', 'O(1)', ['O(n)', 'O(log n)', 'O(n²)'], 'Array indexing jumps straight to the address, whatever the size.'],
  ['window', 'A sorted array holds [1, 3, 4, 8]. For target 9 with two pointers, the first sum is 1 + 8 = 9, so you:', 'Have found the pair', ['Move the left pointer', 'Move the right pointer', 'Sort again'], 'The sum equals the target, so those two values are the answer.'],
  ['window', 'With two pointers on a sorted array, the sum is too big. You should:', 'Move the right pointer left', ['Move the left pointer right', 'Stop', 'Double the target'], 'Moving the right pointer left picks a smaller value, which lowers the sum.'],
  ['window', 'A window of size k over an array of n items has how many positions?', 'n - k + 1', ['n x k', 'n + k', 'k'], 'The window can start at index 0 up to n - k.'],
  ['window', 'Sliding-window sum is faster than recomputing each window because it:', 'Reuses the previous sum', ['Sorts the array', 'Uses recursion', 'Skips every second window'], 'Each step changes only two values, so the update costs O(1) instead of O(k).'],
  ['memory', 'Which structure is FIFO (first in, first out)?', 'Queue', ['Stack', 'Heap', 'Trie'], 'Items leave in the order they arrived, like people in a line.'],
  ['memory', 'BFS explores a graph:', 'Level by level using a queue', ['Deep first using a stack only', 'In sorted order', 'Randomly'], 'A queue processes the closest nodes before the farther ones.'],
  ['memory', 'Which sort has O(n²) worst case but is fast on average?', 'Quicksort', ['Merge sort', 'Heap sort', 'Counting sort'], 'Bad pivots can make quicksort quadratic, but random or median pivots make that rare.'],
  ['memory', 'A min-heap guarantees that:', 'Each parent is smaller than or equal to its children', ['The array is sorted', 'Left children are smaller than right children', 'Leaves are the maximum'], 'The smallest element is at the root, but siblings are not ordered.'],
  ['stackdef', 'Reading ( [ ) ] with a stack, what happens at the first )?', 'The top is [, so the string is invalid', ['It pops ( and continues', 'It pushes )', 'It is valid'], 'The closer must match the most recent unmatched opener, which is [.'],
  ['stackdef', 'What is the value of the postfix expression 5 1 2 + 4 * + 3 - ?', '14', ['12', '16', '9'], '1 2 + = 3, 3 4 * = 12, 5 12 + = 17, 17 3 - = 14.'],
  ['stackdef', 'How long does it take to check n brackets with a stack?', 'O(n)', ['O(n²)', 'O(log n)', 'O(1)'], 'Each character is pushed or popped at most once.'],
  ['stackdef', 'In postfix, for 8 3 -, the result is:', '5', ['-5', '11', '24'], 'The operator takes the second-from-top value minus the top: 8 - 3 = 5.'],
  ['bug', 'A function should return the average of an array but divides by a.length - 1. This is:', 'A bug: it should divide by a.length', ['Correct', 'A performance issue', 'A syntax error'], 'The average divides by the number of elements.'],
  ['bug', 'Which input should you test first when hunting off-by-one bugs?', 'An empty or single-element input', ['A huge random array', 'Only sorted data', 'Only negative numbers'], 'Boundary cases expose loops that start or stop one step off.'],
  ['bug', 'A loop for (i = s.length - 1; i > 0; i--) reverses a string. What is wrong?', 'It skips index 0', ['It runs forever', 'It skips the last character', 'Nothing'], 'i > 0 stops before reaching index 0, so s[0] is never added.'],
  ['bug', 'Palindrome check with two pointers: what must happen to the right pointer each step?', 'It moves left (j--)', ['It moves right (j++)', 'It stays put', 'It jumps to the middle'], 'Both pointers move toward each other until they meet.'],
  ['graphb', 'Dijkstra does not work correctly when the graph has:', 'Negative edge weights', ['Cycles', 'Many nodes', 'Duplicate weights'], 'Finalizing the closest node assumes no later path can be shorter, which negative edges break.'],
  ['graphb', 'A spanning tree of a connected graph with n nodes has how many edges?', 'n - 1', ['n', 'n + 1', '2n'], 'It connects all n nodes with no cycles, which takes exactly n - 1 edges.'],
  ['graphb', 'Kruskal starts by:', 'Sorting the edges by weight', ['Picking a start node', 'Finding a cycle', 'Running BFS'], 'It then considers edges from cheapest to dearest.'],
  ['graphb', 'Dijkstra from A finishes node B at distance 4. A later route to B costing 6 is found. B stays at:', '4', ['6', '10', '2'], 'A finalized distance is never replaced by a longer path.'],
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
    out.push({ id: qid(q), room: r, q, opts, answer: opts.indexOf(good), why })
  }
  return out
}

export const qid = (q) => hashStr(q).toString(36)
const toQ = ([r, q, good, bad, why]) => {
  const opts = shuffle([good, ...bad])
  return { id: qid(q), room: r, q, opts, answer: opts.indexOf(good), why }
}
export const questionById = (id) => { const b = BANK.find((x) => qid(x[1]) === id); return b ? toQ(b) : null }
// n random questions from every room (interview mode).
export const mixedQuiz = (n) => shuffle(BANK).slice(0, n).map(toQ)

export const BANK_SIZE = BANK.length
