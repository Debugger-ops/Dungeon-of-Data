// "Write the code" challenges. Each has a starter stub, JSON test cases and a reference solution.
const big = Array.from({ length: 60000 }, (_, i) => i * 2)
const T = (v, l = null, r = null) => ({ v, l, r })

export const CHALLENGES = [
  {
    id: 'bsearch',
    title: 'Binary search',
    fn: 'binarySearch',
    cx: 'O(log n)',
    brief: 'Return the index of key in the sorted array a, or -1 if it is missing.',
    hint: 'Keep lo and hi. Look at the middle: if it is too small move lo up, if too big move hi down. Stop when lo > hi.',
    starter: `function binarySearch(a, key) {\n  // your code here\n  return -1;\n}`,
    tests: [
      { args: [[1, 3, 5, 7, 9], 7], want: 3 },
      { args: [[1, 3, 5, 7, 9], 1], want: 0 },
      { args: [[1, 3, 5, 7, 9], 9], want: 4 },
      { args: [[1, 3, 5, 7, 9], 4], want: -1 },
      { args: [[], 3], want: -1 },
      { args: [[2], 2], want: 0 },
      { label: 'binarySearch(60000 evens, 99998)', args: [big, 99998], want: 49999 },
    ],
    solution: `function binarySearch(a, key) {\n  let lo = 0, hi = a.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (a[mid] === key) return mid;\n    if (a[mid] < key) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}`,
  },
  {
    id: 'brackets',
    title: 'Balanced brackets',
    fn: 'isBalanced',
    cx: 'O(n)',
    brief: 'Return true if every ( [ { in the string is closed in the right order by ) ] }.',
    hint: 'Use a stack. Push each opener. On a closer, pop and check it is the matching opener. At the end the stack must be empty.',
    starter: `function isBalanced(s) {\n  // your code here\n  return false;\n}`,
    tests: [
      { args: ['()'], want: true },
      { args: ['([]{})'], want: true },
      { args: [''], want: true },
      { args: ['(]'], want: false },
      { args: ['(('], want: false },
      { args: ['())'], want: false },
      { args: ['{[()]}('], want: false },
      { args: ['a(b)c'], want: true },
    ],
    solution: `function isBalanced(s) {\n  const pair = { ')': '(', ']': '[', '}': '{' };\n  const st = [];\n  for (const ch of s) {\n    if ('([{'.includes(ch)) st.push(ch);\n    else if (ch in pair) {\n      if (st.pop() !== pair[ch]) return false;\n    }\n  }\n  return st.length === 0;\n}`,
  },
  {
    id: 'fib',
    title: 'Fibonacci (fast)',
    fn: 'fib',
    cx: 'O(n)',
    brief: 'Return the n-th Fibonacci number (fib(0)=0, fib(1)=1). Naive recursion is far too slow for fib(45).',
    hint: 'Remember answers you already computed (a memo object), or just loop keeping the last two values.',
    starter: `function fib(n) {\n  // your code here\n  return 0;\n}`,
    tests: [
      { args: [0], want: 0 },
      { args: [1], want: 1 },
      { args: [10], want: 55 },
      { args: [30], want: 832040 },
      { args: [45], want: 1134903170 },
    ],
    solution: `function fib(n) {\n  let a = 0, b = 1;\n  for (let i = 0; i < n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return a;\n}`,
  },
  {
    id: 'coin',
    title: 'Coin change',
    fn: 'coinChange',
    cx: 'O(n * amount)',
    brief: 'Fewest coins that add up to amount (unlimited coins of each value), or -1 if impossible.',
    hint: 'dp[x] = fewest coins for amount x. dp[0] = 0. For each x try every coin c <= x: dp[x] = min(dp[x], dp[x - c] + 1).',
    starter: `function coinChange(coins, amount) {\n  // your code here\n  return -1;\n}`,
    tests: [
      { args: [[1, 2, 5], 11], want: 3 },
      { args: [[2], 3], want: -1 },
      { args: [[1], 0], want: 0 },
      { args: [[1, 5, 6, 9], 11], want: 2 },
      { args: [[186, 419, 83, 408], 6249], want: 20 },
      { args: [[1, 5, 10, 21, 25], 63], want: 3 },
    ],
    solution: `function coinChange(coins, amount) {\n  const dp = new Array(amount + 1).fill(Infinity);\n  dp[0] = 0;\n  for (let x = 1; x <= amount; x++) {\n    for (const c of coins) {\n      if (c <= x) dp[x] = Math.min(dp[x], dp[x - c] + 1);\n    }\n  }\n  return dp[amount] === Infinity ? -1 : dp[amount];\n}`,
  },
  {
    id: 'height',
    title: 'Tree height',
    fn: 'height',
    cx: 'O(n)',
    brief: 'A node is { v, l, r } and a missing child is null. Return the number of levels (null has height 0).',
    hint: 'Recursion: the height of a node is 1 + the larger of its two children heights. The base case is null.',
    starter: `function height(node) {\n  // your code here\n  return 0;\n}`,
    tests: [
      { label: 'height(null)', args: [null], want: 0 },
      { label: 'height(one node)', args: [T(1)], want: 1 },
      { label: 'height(root with 2 kids)', args: [T(1, T(2), T(3))], want: 2 },
      { label: 'height(left chain of 4)', args: [T(1, T(2, T(3, T(4))))], want: 4 },
      { label: 'height(uneven tree)', args: [T(5, T(3, null, T(4, T(9))), T(8))], want: 4 },
    ],
    solution: `function height(node) {\n  if (node === null) return 0;\n  return 1 + Math.max(height(node.l), height(node.r));\n}`,
  },
  {
    id: 'twosum',
    title: 'Two sum',
    fn: 'twoSum',
    cx: 'O(n)',
    brief: 'Find the two different indices whose values add up to target. Return them as [i, j] with i < j. Exactly one pair exists.',
    hint: 'Walk once, keeping a Map from value to index. For each x, check whether target - x is already in the map.',
    starter: `function twoSum(nums, target) {\n  // your code here\n  return [];\n}`,
    tests: [
      { args: [[2, 7, 11, 15], 9], want: [0, 1] },
      { args: [[3, 2, 4], 6], want: [1, 2] },
      { args: [[3, 3], 6], want: [0, 1] },
      { args: [[-1, -2, -3, -4, -5], -8], want: [2, 4] },
      { label: 'twoSum(60000 numbers, 239994)', args: [big, 239994], want: [59998, 59999] },
    ],
    solution: `function twoSum(nums, target) {\n  const seen = new Map();\n  for (let j = 0; j < nums.length; j++) {\n    const i = seen.get(target - nums[j]);\n    if (i !== undefined) return [i, j];\n    seen.set(nums[j], j);\n  }\n  return [];\n}`,
  },
]

export const testLabel = (c, t) => {
  if (t.label) return t.label
  const s = `${c.fn}(${t.args.map((a) => JSON.stringify(a)).join(', ')})`
  return s.length > 54 ? s.slice(0, 51) + '...' : s
}
