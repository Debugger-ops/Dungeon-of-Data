import { rand } from './util'

// ---- Bracket matching with an explicit stack ----
const PAIR = { '(': ')', '[': ']', '{': '}' }
const OPEN = Object.keys(PAIR)
const CLOSE = Object.values(PAIR)

const balanced = (pairs) => {
  const out = []
  const stack = []
  let opens = 0
  while (out.length < pairs * 2) {
    const canOpen = opens < pairs
    if (canOpen && (stack.length === 0 || rand(0, 1) === 0)) {
      const o = OPEN[rand(0, 2)]
      out.push(o)
      stack.push(o)
      opens++
    } else out.push(PAIR[stack.pop()])
  }
  return out.join('')
}

// Half the time return a valid string, otherwise break it in one way.
export function bracketString() {
  let s = balanced(rand(3, 4))
  if (rand(0, 1) === 1) {
    const how = rand(0, 2)
    if (how === 0) s = s.slice(0, -1) // missing closer
    else if (how === 1) {
      const i = rand(0, s.length - 1)
      const alt = (CLOSE.includes(s[i]) ? CLOSE : OPEN).filter((c) => c !== s[i])
      s = s.slice(0, i) + alt[rand(0, alt.length - 1)] + s.slice(i + 1)
    } else s = ')' + s.slice(0, -1) // closer with nothing open
  }
  return s
}

// The correct action for each token: push, pop, reject. The final token 'end' needs accept (stack empty) or reject.
export function bracketRun(s) {
  const stack = []
  const steps = []
  for (const ch of s) {
    const before = stack.slice()
    if (OPEN.includes(ch)) {
      stack.push(ch)
      steps.push({ ch, action: 'push', before, after: stack.slice(), why: `${ch} opens a group, so push it.` })
    } else if (stack.length && PAIR[stack[stack.length - 1]] === ch) {
      stack.pop()
      steps.push({ ch, action: 'pop', before, after: stack.slice(), why: `${ch} closes the top ${before[before.length - 1]}, so pop it.` })
    } else {
      steps.push({ ch, action: 'reject', before, after: before, why: stack.length ? `${ch} does not match the top ${before[before.length - 1]}, so the string is invalid.` : `${ch} has nothing to close, so the string is invalid.` })
      return { steps, valid: false }
    }
  }
  steps.push({ ch: 'end', action: stack.length ? 'reject' : 'accept', before: stack.slice(), after: stack.slice(), why: stack.length ? `The stack still holds ${stack.join(' ')}: something was never closed.` : 'The stack is empty, so every group was closed. Valid.' })
  return { steps, valid: stack.length === 0 }
}

// ---- Postfix (reverse Polish) evaluation ----
const OPS = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b }
export function postfixPuzzle(nums = 4) {
  const tokens = []
  let depth = 0
  let placed = 0
  let opsLeft = nums - 1
  while (placed < nums || opsLeft > 0) {
    if (placed < nums && (depth < 2 || opsLeft === 0 || rand(0, 1) === 0)) {
      tokens.push(rand(1, 9))
      placed++
      depth++
    } else {
      tokens.push(['+', '-', '*'][rand(0, 2)])
      opsLeft--
      depth--
    }
  }
  return { tokens, steps: postfixRun(tokens) }
}
export function postfixRun(tokens) {
  const st = []
  return tokens.map((t) => {
    if (typeof t === 'number') {
      st.push(t)
      return { t, kind: 'push', stack: st.slice() }
    }
    const b = st.pop()
    const a = st.pop()
    const v = OPS[t](a, b)
    st.push(v)
    return { t, kind: 'op', a, b, value: v, stack: st.slice() }
  })
}
