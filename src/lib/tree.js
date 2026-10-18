let NID = 0
export const mk = (v) => ({ v, l: null, r: null, id: ++NID })

export function bstInsert(root, v) {
  if (!root) return mk(v)
  let n = root
  for (;;) {
    if (v < n.v) {
      if (!n.l) {
        n.l = mk(v)
        break
      }
      n = n.l
    } else {
      if (!n.r) {
        n.r = mk(v)
        break
      }
      n = n.r
    }
  }
  return root
}

// Where would v be inserted, and which comparisons lead there?
export function pathText(root, v) {
  let n = root
  const parts = []
  for (;;) {
    if (v < n.v) {
      parts.push(`${v} < ${n.v}: go left`)
      if (!n.l) return { parts, parent: n, side: 'l' }
      n = n.l
    } else {
      parts.push(`${v} > ${n.v}: go right`)
      if (!n.r) return { parts, parent: n, side: 'r' }
      n = n.r
    }
  }
}

// In-order x positions, depth y positions. Optional ghost slots for empty children.
export function treeLayout(root, ghosts) {
  const items = []
  const by = new Map()
  ;(function walk(n, d, parent, side) {
    if (!n) {
      if (ghosts && parent) items.push({ ghost: true, d, parent, side })
      return
    }
    walk(n.l, d + 1, n, 'l')
    const it = { node: n, d, parent }
    items.push(it)
    by.set(n, it)
    walk(n.r, d + 1, n, 'r')
  })(root, 0, null, null)
  const W = 640
  const len = items.length
  const md = Math.max(...items.map((i) => i.d))
  items.forEach((it, i) => {
    it.x = len > 1 ? 30 + (i * (W - 60)) / (len - 1) : W / 2
    it.y = 30 + it.d * 56
  })
  return { items, by, H: 30 + md * 56 + 34, W }
}

export function traverse(root, kind) {
  const out = []
  const walk = (n) => {
    if (!n) return
    if (kind === 'pre') out.push(n)
    walk(n.l)
    if (kind === 'in') out.push(n)
    walk(n.r)
    if (kind === 'post') out.push(n)
  }
  walk(root)
  return out
}
