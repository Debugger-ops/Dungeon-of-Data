import { describe, expect, it } from 'vitest'
import { bstInsert, pathText, traverse } from '../../src/lib/tree'

const build = (vals) => vals.reduce((root, v) => bstInsert(root, v), null)
const vals = (nodes) => nodes.map((n) => n.v)

describe('BST', () => {
  const root = build([50, 30, 70, 20, 40, 60, 80])
  it('in-order is sorted', () => expect(vals(traverse(root, 'in'))).toEqual([20, 30, 40, 50, 60, 70, 80]))
  it('pre-order visits node first', () => expect(vals(traverse(root, 'pre'))).toEqual([50, 30, 20, 40, 70, 60, 80]))
  it('post-order visits node last', () => expect(vals(traverse(root, 'post'))).toEqual([20, 40, 30, 60, 80, 70, 50]))
  it('explains the insertion path', () => {
    const r = pathText(root, 65)
    expect(r.parts).toEqual(['65 > 50: go right', '65 < 70: go left', '65 > 60: go right'])
    expect(r.parent.v).toBe(60)
    expect(r.side).toBe('r')
  })
})
