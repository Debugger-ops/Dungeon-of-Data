import { describe, expect, it } from 'vitest'
import { ALGOS, buildFrames, inv, minSwaps } from '../../src/lib/algos'

describe('inversions and minimum swaps', () => {
  it('counts inversions', () => {
    expect(inv([3, 1, 2])).toBe(2)
    expect(inv([1, 2, 3, 4])).toBe(0)
    expect(inv([4, 3, 2, 1])).toBe(6)
  })
  it('computes minimum swaps as n minus cycles', () => {
    expect(minSwaps([2, 1, 4, 3])).toBe(2)
    expect(minSwaps([1, 2, 3])).toBe(0)
    expect(minSwaps([3, 1, 2])).toBe(2)
  })
})

describe('buildFrames', () => {
  const input = [5, 2, 9, 1, 7, 3]
  const sorted = [...input].sort((a, b) => a - b)
  it.each(Object.keys(ALGOS))('%s ends sorted', (algo) => {
    const frames = buildFrames(algo, input)
    expect(frames.length).toBeGreaterThan(1)
    expect(frames[frames.length - 1].a).toEqual(sorted)
  })
  it('does not mutate its input', () => {
    const copy = [...input]
    buildFrames('quick', copy)
    expect(copy).toEqual(input)
  })
})
