import { describe, it, expect } from 'vitest'
import { prepare, initTyper, press, accuracy, tilesLost, typingStars, wpm } from '../../src/lib/typing.js'
import { SNIPPETS } from '../../src/lib/snippets.js'

const typeAll = (lines, text) => {
  let s = initTyper()
  let last = 'none'
  for (const ch of text) {
    const r = press(lines, s, ch, 1000)
    s = r.s
    last = r.ev
  }
  return { s, last }
}
const full = (lines) => lines.map((l) => l.text).join('\n')

describe('typing engine', () => {
  it('skips blank lines and records indentation', () => {
    const l = prepare('a\n\n  b\n')
    expect(l).toEqual([{ indent: 0, text: 'a' }, { indent: 2, text: 'b' }])
  })
  it('wrong keys do not advance and count as errors', () => {
    const l = prepare('ab')
    const r = press(l, initTyper(), 'x')
    expect(r.ev).toBe('err')
    expect(r.s.ci).toBe(0)
    expect(r.s.errors).toBe(1)
  })
  it('Enter ends a line and the last character ends the snippet', () => {
    const l = prepare('ab\ncd')
    let r = press(l, initTyper(), 'a')
    r = press(l, r.s, 'b')
    expect(r.ev).toBe('ok')
    r = press(l, r.s, '\n')
    expect(r.ev).toBe('line')
    expect(r.s.li).toBe(1)
    r = press(l, r.s, 'c')
    r = press(l, r.s, 'd')
    expect(r.ev).toBe('done')
  })
  it('scores', () => {
    expect([0, 3, 7].map(tilesLost)).toEqual([0, 1, 2])
    expect([0, 2, 3, 6, 7].map(typingStars)).toEqual([3, 3, 2, 2, 1])
    const s = { keys: 10, correct: 9, errors: 1, start: 0 }
    expect(accuracy(s)).toBe(90)
    expect(wpm({ ...s, correct: 50 }, 60000)).toBe(10)
  })
  for (const sn of SNIPPETS) {
    for (const lang of ['js', 'py']) {
      it(`${sn.id} (${lang}) is ASCII and fully typeable`, () => {
        const lines = prepare(sn[lang])
        expect(/^[\x20-\x7e\n]*$/.test(sn[lang])).toBe(true)
        const { s, last } = typeAll(lines, full(lines))
        expect(last).toBe('done')
        expect(s.errors).toBe(0)
      })
    }
  }
})
