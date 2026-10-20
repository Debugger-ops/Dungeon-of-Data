import { describe, expect, it } from 'vitest'
import { SIZES, bstHeights, sortCounts } from '../../src/lib/bench'

describe('measured sorting counts', () => {
  const sorted = sortCounts('sorted')
  const reversed = sortCounts('reversed')
  const random = sortCounts('random')
  const last = SIZES.length - 1
  const n = SIZES[last]

  it('insertion and bubble are linear on sorted input', () => {
    expect(sorted.insertion[last]).toBe(n - 1)
    expect(sorted.bubble[last]).toBe(n - 1)
  })
  it('quick sort with a last-element pivot is quadratic on sorted input', () => {
    expect(sorted.quick[last]).toBe((n * (n - 1)) / 2)
  })
  it('selection sort always makes n(n-1)/2 comparisons', () => {
    ;[sorted, reversed, random].forEach((c) => expect(c.selection[last]).toBe((n * (n - 1)) / 2))
  })
  it('merge sort stays at or below n log2 n', () => {
    ;[sorted, reversed, random].forEach((c) => SIZES.forEach((size, i) => expect(c.merge[i]).toBeLessThanOrEqual(size * Math.log2(size))))
  })
})

describe('BST height experiment', () => {
  const h = bstHeights()
  it('sorted inserts degenerate to a chain, random stays shallow', () => {
    expect(h.sorted).toEqual(SIZES)
    expect(h.random[SIZES.length - 1]).toBeLessThan(40)
    expect(h.random[SIZES.length - 1]).toBeGreaterThan(h.ideal[SIZES.length - 1])
  })
})
