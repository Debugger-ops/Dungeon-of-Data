import { rand, shuffle } from './util'

export const W = 8
export const toBits = (x) => (x & 255).toString(2).padStart(W, '0')
export const popcount = (x) => toBits(x).split('1').length - 1

// One 8-bit operation puzzle: predict the result.
export function genOp() {
  const kind = ['and', 'or', 'xor', 'shl', 'shr', 'not'][rand(0, 5)]
  const a = rand(1, 255)
  const b = rand(1, 255)
  const k = rand(1, 3)
  switch (kind) {
    case 'and': return { kind, a, b, text: `${a} & ${b}`, result: a & b, rule: 'AND keeps a bit only where both inputs have a 1.' }
    case 'or': return { kind, a, b, text: `${a} | ${b}`, result: a | b, rule: 'OR sets a bit where either input has a 1.' }
    case 'xor': return { kind, a, b, text: `${a} ^ ${b}`, result: a ^ b, rule: 'XOR sets a bit where the inputs differ.' }
    case 'shl': return { kind, a, k, text: `${a} << ${k}  (keep 8 bits)`, result: (a << k) & 255, rule: `Shift left by ${k}: every bit moves up ${k} places, new low bits are 0, bits past the top fall off.` }
    case 'shr': return { kind, a, k, text: `${a} >> ${k}`, result: a >> k, rule: `Shift right by ${k}: every bit moves down ${k} places and the low bits fall off (it divides by 2^${k}, rounding down).` }
    default: return { kind, a, text: `~${a}  (keep 8 bits)`, result: ~a & 255, rule: 'NOT flips every bit, so the result is 255 minus the input.' }
  }
}

const near = (v, lo = 0, hi = 255) => {
  const set = new Set([v])
  for (const d of [1, 2, -1, -2, 4, -4, 8]) if (set.size < 4 && v + d >= lo && v + d <= hi) set.add(v + d)
  while (set.size < 4) set.add(rand(lo, hi))
  return shuffle([...set])
}

// Multiple-choice bit tricks.
export function trick() {
  const kind = ['pop', 'clear', 'low', 'pow2', 'even'][rand(0, 4)]
  if (kind === 'pop') {
    const x = rand(1, 255)
    return { q: `How many 1 bits are in ${x} (${toBits(x)})?`, answer: popcount(x), opts: near(popcount(x), 0, 8), hint: 'Write the number in binary and count the 1s.', why: 'This count is called the popcount (Hamming weight).' }
  }
  if (kind === 'clear') {
    const x = rand(2, 255)
    return { q: `What is ${x} & (${x} - 1)?`, answer: x & (x - 1), opts: near(x & (x - 1)), hint: 'It turns the rightmost 1 bit into 0. Write x in binary first.', why: `x & (x - 1) clears the lowest set bit: ${toBits(x)} becomes ${toBits(x & (x - 1))}.` }
  }
  if (kind === 'low') {
    const x = rand(1, 255)
    return { q: `What is ${x} & -${x}? (the lowest set bit isolated)`, answer: x & -x, opts: near(x & -x), hint: 'Keep only the rightmost 1 bit and zero everything else, then convert back to decimal.', why: `x & -x keeps only the lowest 1 bit of ${toBits(x)}.` }
  }
  if (kind === 'pow2') {
    const x = rand(1, 64)
    const is = (x & (x - 1)) === 0
    return { q: `Is ${x} a power of two? Check x & (x - 1) === 0.`, answer: is ? 'Yes' : 'No', opts: ['Yes', 'No'], hint: 'A power of two has exactly one 1 bit in binary.', why: `${x} & ${x - 1} = ${x & (x - 1)}, so it ${is ? 'is' : 'is not'} a power of two (a power of two has exactly one 1 bit).` }
  }
  const x = rand(1, 255)
  return { q: `What is the lowest bit of ${x} (${toBits(x)}), that is x & 1?`, answer: x & 1, opts: [0, 1], hint: 'Look at the last binary digit.', why: 'The lowest bit tells you if a number is odd (1) or even (0).' }
}
