export const CLASSES = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)']

// Each item: code to read, the correct class and why.
export const BIGO = [
  { code: 'return a[0] + a[a.length - 1];', ans: 'O(1)', why: 'Two array reads. The work does not depend on n.' },
  { code: 'let s = 0;\nfor (let i = 0; i < n; i++) s += a[i];', ans: 'O(n)', why: 'One pass over n items.' },
  { code: 'for (let i = 0; i < n; i++)\n  for (let j = 0; j < n; j++)\n    count++;', ans: 'O(n²)', why: 'Two nested loops of n each: n x n.' },
  { code: 'while (n > 1) {\n  n = Math.floor(n / 2);\n}', ans: 'O(log n)', why: 'n is halved each step, so about log2(n) steps.' },
  { code: 'for (let i = 0; i < n; i++)\n  for (let j = 1; j < n; j *= 2)\n    count++;', ans: 'O(n log n)', why: 'The outer loop runs n times, the inner doubles j so it runs log n times.' },
  { code: 'function fib(n) {\n  if (n < 2) return n;\n  return fib(n - 1) + fib(n - 2);\n}', ans: 'O(2ⁿ)', why: 'Each call makes two more calls, so the call tree roughly doubles at every level.' },
  { code: 'const sorted = a.slice().sort((x, y) => x - y);', ans: 'O(n log n)', why: 'Comparison sorting needs about n log n comparisons.' },
  { code: 'let lo = 0, hi = n - 1;\nwhile (lo <= hi) {\n  const mid = (lo + hi) >> 1;\n  if (a[mid] < key) lo = mid + 1;\n  else hi = mid - 1;\n}', ans: 'O(log n)', why: 'Each iteration discards half of the remaining range.' },
  { code: 'for (let i = 0; i < n; i++)\n  for (let j = 0; j < i; j++)\n    count++;', ans: 'O(n²)', why: 'The inner loop runs 0 + 1 + ... + (n-1) = n(n-1)/2 times, which is O(n²).' },
  { code: 'for (let i = 0; i < n; i++)\n  for (let j = 0; j < 5; j++)\n    count++;', ans: 'O(n)', why: 'The inner loop is a fixed 5 steps, a constant, so the total is 5n = O(n).' },
  { code: 'return set.has(x);', ans: 'O(1)', why: 'A hash lookup takes constant time on average.' },
  { code: 'for (let m = 0; m < (1 << n); m++)\n  count++;', ans: 'O(2ⁿ)', why: '1 << n is 2 to the power n, and the loop runs that many times.' },
  { code: 'for (let i = 0; i < n; i++) x++;\nfor (let j = 0; j < n; j++) y++;', ans: 'O(n)', why: 'Two loops one after the other add up: n + n = 2n = O(n).' },
  { code: 'for (let i = 1; i < n; i *= 2)\n  count++;', ans: 'O(log n)', why: 'i doubles each time, so it reaches n after log2(n) steps.' },
  { code: 'function sum(a, lo, hi) {\n  if (lo === hi) return a[lo];\n  const mid = (lo + hi) >> 1;\n  return sum(a, lo, mid) + sum(a, mid + 1, hi);\n}', ans: 'O(n)', why: 'The recursion tree has one leaf per element and about n nodes in total. Splitting is free here, unlike merge sort.' },
  { code: 'for (const x of a) {\n  if (b.includes(x)) count++;\n}', ans: 'O(n²)', why: 'includes scans array b (n items) for each of the n items in a.' },
]
