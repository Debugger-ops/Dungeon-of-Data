// Code to type. Each snippet has JavaScript and Python versions. ASCII only, no tabs, short lines.
export const SNIPPETS = [
  {
    id: 'bsearch',
    title: 'Binary search',
    cx: 'O(log n)',
    blurb: 'Halve the sorted range every step until the key is found.',
    js: `function binarySearch(a, key) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === key) return mid;
    if (a[mid] < key) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
    py: `def binary_search(a, key):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == key:
            return mid
        if a[mid] < key:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
  },
  {
    id: 'bubble',
    title: 'Bubble sort',
    cx: 'O(n^2)',
    blurb: 'Swap neighbours that are out of order; stop early when a pass makes no swap.',
    js: `function bubbleSort(a) {
  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return a;
}`,
    py: `def bubble_sort(a):
    for i in range(len(a) - 1):
        swapped = False
        for j in range(len(a) - i - 1):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swapped = True
        if not swapped:
            break
    return a`,
  },
  {
    id: 'insertion',
    title: 'Insertion sort',
    cx: 'O(n^2), O(n) if sorted',
    blurb: 'Grow a sorted prefix by sliding each new item left into place.',
    js: `function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    const x = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > x) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = x;
  }
  return a;
}`,
    py: `def insertion_sort(a):
    for i in range(1, len(a)):
        x = a[i]
        j = i - 1
        while j >= 0 and a[j] > x:
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = x
    return a`,
  },
  {
    id: 'reverse',
    title: 'Reverse a linked list',
    cx: 'O(n) time, O(1) space',
    blurb: 'Save next, flip the pointer, then advance. Three pointers, one pass.',
    js: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
    py: `def reverse_list(head):
    prev = None
    curr = head
    while curr is not None:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
  },
  {
    id: 'bfs',
    title: 'Breadth-first search',
    cx: 'O(V + E)',
    blurb: 'A queue explores the graph layer by layer from the start node.',
    js: `function bfs(graph, start) {
  const seen = new Set([start]);
  const queue = [start];
  const order = [];
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const v of graph[u]) {
      if (!seen.has(v)) {
        seen.add(v);
        queue.push(v);
      }
    }
  }
  return order;
}`,
    py: `from collections import deque

def bfs(graph, start):
    seen = {start}
    queue = deque([start])
    order = []
    while queue:
        u = queue.popleft()
        order.append(u)
        for v in graph[u]:
            if v not in seen:
                seen.add(v)
                queue.append(v)
    return order`,
  },
  {
    id: 'fib',
    title: 'Fibonacci with memoization',
    cx: 'O(n) instead of O(2^n)',
    blurb: 'Cache each answer so every subproblem is solved only once.',
    js: `function fib(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n] !== undefined) return memo[n];
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}`,
    py: `def fib(n, memo={}):
    if n <= 1:
        return n
    if n in memo:
        return memo[n]
    memo[n] = fib(n - 1) + fib(n - 2)
    return memo[n]`,
  },
  {
    id: 'coin',
    title: 'Coin change (DP)',
    cx: 'O(amount x coins)',
    blurb: 'dp[a] is the fewest coins for amount a, built from smaller amounts.',
    js: `function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
    py: `def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return -1 if dp[amount] == float('inf') else dp[amount]`,
  },
  {
    id: 'bst',
    title: 'BST insert',
    cx: 'O(h), h = tree height',
    blurb: 'Go left for smaller keys, right for larger, until you find an empty spot.',
    js: `function insert(root, v) {
  if (root === null) return { v, l: null, r: null };
  if (v < root.v) root.l = insert(root.l, v);
  else root.r = insert(root.r, v);
  return root;
}`,
    py: `def insert(root, v):
    if root is None:
        return Node(v)
    if v < root.v:
        root.l = insert(root.l, v)
    else:
        root.r = insert(root.r, v)
    return root`,
  },
]
