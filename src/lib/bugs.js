// Bug Hunt: each entry has a correct version and a buggy version that differ on exactly one line.
// tests: [args, want] pairs. The unit tests check that the fix passes and the bug fails.
const E = (title, fn, fixed, buggy, tests, why) => ({ title, fn, fixed, buggy, tests, why })

export const BUGS = [
  E('Sum 1..n', 'sumTo',
    'function sumTo(n) {\n  let s = 0;\n  for (let i = 1; i <= n; i++) {\n    s += i;\n  }\n  return s;\n}',
    'function sumTo(n) {\n  let s = 0;\n  for (let i = 1; i < n; i++) {\n    s += i;\n  }\n  return s;\n}',
    [[[5], 15], [[1], 1], [[0], 0]], 'Off-by-one: i < n stops before n, so n itself is never added. It should be i <= n.'),
  E('Largest value', 'maxOf',
    'function maxOf(a) {\n  let m = a[0];\n  for (let i = 1; i < a.length; i++) {\n    if (a[i] > m) m = a[i];\n  }\n  return m;\n}',
    'function maxOf(a) {\n  let m = 0;\n  for (let i = 1; i < a.length; i++) {\n    if (a[i] > m) m = a[i];\n  }\n  return m;\n}',
    [[[[3, 9, 2]], 9], [[[-5, -2, -8]], -2]], 'Starting from 0 breaks when every value is negative. Start from the first element instead.'),
  E('Binary search', 'binarySearch',
    'function binarySearch(a, key) {\n  let lo = 0, hi = a.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (a[mid] === key) return mid;\n    if (a[mid] < key) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}',
    'function binarySearch(a, key) {\n  let lo = 0, hi = a.length - 1;\n  while (lo < hi) {\n    const mid = (lo + hi) >> 1;\n    if (a[mid] === key) return mid;\n    if (a[mid] < key) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}',
    [[[[1, 3, 5, 7], 7], 3], [[[4], 4], 0], [[[1, 3, 5, 7], 5], 2]], 'lo < hi quits when one candidate is left and never checks it. The range [lo, hi] is inclusive, so the loop must use lo <= hi.'),
  E('Factorial', 'factorial',
    'function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}',
    'function factorial(n) {\n  if (n === 1) return 1;\n  return n * factorial(n - 1);\n}',
    [[[5], 120], [[1], 1], [[0], 1]], 'The base case misses n = 0, so factorial(0) recurses forever. Use n <= 1.'),
  E('Reverse a string', 'reverseStr',
    'function reverseStr(s) {\n  let out = "";\n  for (let i = s.length - 1; i >= 0; i--) {\n    out += s[i];\n  }\n  return out;\n}',
    'function reverseStr(s) {\n  let out = "";\n  for (let i = s.length - 1; i > 0; i--) {\n    out += s[i];\n  }\n  return out;\n}',
    [[['abc'], 'cba'], [['x'], 'x']], 'i > 0 never reaches index 0, so the first character is dropped. It should be i >= 0.'),
  E('Palindrome check', 'isPalin',
    'function isPalin(s) {\n  let i = 0, j = s.length - 1;\n  while (i < j) {\n    if (s[i] !== s[j]) return false;\n    i++;\n    j--;\n  }\n  return true;\n}',
    'function isPalin(s) {\n  let i = 0, j = s.length - 1;\n  while (i < j) {\n    if (s[i] !== s[j]) return false;\n    i++;\n    j++;\n  }\n  return true;\n}',
    [[['aba'], true], [['abca'], false], [['abba'], true]], 'The right pointer must move inwards (j--), not outwards. j++ walks off the end of the string.'),
  E('Swap first and last', 'swapEnds',
    'function swapEnds(a) {\n  const t = a[0];\n  a[0] = a[a.length - 1];\n  a[a.length - 1] = t;\n  return a;\n}',
    'function swapEnds(a) {\n  const t = a[0];\n  a[0] = a[a.length - 1];\n  a[a.length - 1] = a[0];\n  return a;\n}',
    [[[[1, 2, 3]], [3, 2, 1]]], 'a[0] was already overwritten on the line before, so it holds the last value. The saved copy t must be used.'),
  E('Fibonacci', 'fib',
    'function fib(n) {\n  let a = 0, b = 1;\n  for (let i = 0; i < n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return a;\n}',
    'function fib(n) {\n  let a = 0, b = 1;\n  for (let i = 0; i < n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}',
    [[[5], 5], [[0], 0], [[10], 55]], 'After n steps a holds fib(n) and b is already one step ahead. Return a.'),
  E('Remove duplicates', 'dedupe',
    'function dedupe(a) {\n  const seen = new Set();\n  const out = [];\n  for (const x of a) {\n    if (!seen.has(x)) {\n      seen.add(x);\n      out.push(x);\n    }\n  }\n  return out;\n}',
    'function dedupe(a) {\n  const seen = new Set();\n  const out = [];\n  for (const x of a) {\n    if (seen.has(x)) {\n      seen.add(x);\n      out.push(x);\n    }\n  }\n  return out;\n}',
    [[[[1, 2, 1, 3, 2]], [1, 2, 3]]], 'The condition is inverted. You want to keep a value only if it has NOT been seen yet.'),
  E('Average', 'average',
    'function average(a) {\n  let sum = 0;\n  for (const x of a) sum += x;\n  return sum / a.length;\n}',
    'function average(a) {\n  let sum = 0;\n  for (const x of a) sum += x;\n  return sum / (a.length - 1);\n}',
    [[[[2, 4, 6]], 4], [[[10]], 10]], 'Divide by the number of elements, a.length, not one less.'),
  E('Is sorted?', 'isSorted',
    'function isSorted(a) {\n  for (let i = 1; i < a.length; i++) {\n    if (a[i - 1] > a[i]) return false;\n  }\n  return true;\n}',
    'function isSorted(a) {\n  for (let i = 1; i < a.length; i++) {\n    if (a[i - 1] < a[i]) return false;\n  }\n  return true;\n}',
    [[[[1, 2, 3]], true], [[[3, 1]], false]], 'The comparison is flipped. A list is unsorted when a previous value is GREATER than the next.'),
]

// Index of the one line that differs.
export const bugLine = (b) => {
  const f = b.fixed.split('\n')
  const x = b.buggy.split('\n')
  return x.findIndex((l, i) => l !== f[i])
}
