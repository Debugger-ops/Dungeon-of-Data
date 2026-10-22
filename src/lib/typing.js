// Pure typing-game logic: no React, no DOM, so it is easy to test.
// A snippet becomes lines of { indent, text }. Indentation is filled in for you; blank lines are skipped.

export function prepare(code) {
  return code
    .split('\n')
    .map((l) => ({ indent: l.length - l.trimStart().length, text: l.trim() }))
    .filter((l) => l.text)
}

export const initTyper = () => ({ li: 0, ci: 0, keys: 0, errors: 0, correct: 0, start: null })

// Feed one typed character. Wrong keys never advance. Enter ends a line (the last line ends on its final character).
// Returns { s: newState, ev: 'ok' | 'err' | 'line' | 'done' | 'none' }.
export function press(lines, s, ch, now = Date.now()) {
  if (s.li >= lines.length) return { s, ev: 'none' }
  const key = ch === '\r' ? '\n' : ch
  const line = lines[s.li]
  const last = s.li === lines.length - 1
  const want = s.ci < line.text.length ? line.text[s.ci] : '\n'
  const base = { ...s, keys: s.keys + 1, start: s.start === null ? now : s.start }
  if (key !== want) return { s: { ...base, errors: s.errors + 1 }, ev: 'err' }
  const correct = base.correct + 1
  if (want === '\n') {
    const li = s.li + 1
    return { s: { ...base, li, ci: 0, correct }, ev: li >= lines.length ? 'done' : 'line' }
  }
  if (last && s.ci + 1 === line.text.length) return { s: { ...base, li: s.li + 1, ci: 0, correct }, ev: 'done' }
  return { s: { ...base, ci: s.ci + 1, correct }, ev: 'ok' }
}

export const accuracy = (s) => (s.keys ? Math.round((100 * s.correct) / s.keys) : 100)
// Standard typing-speed convention: 5 characters = 1 word.
export const wpm = (s, now = Date.now()) => (s.start === null ? 0 : Math.round(s.correct / 5 / Math.max((now - s.start) / 60000, 1 / 60)))
// Every 3 wrong keys lets the goblins take a step.
export const tilesLost = (errors) => Math.floor(errors / 3)
export const typingStars = (errors) => (errors <= 2 ? 3 : errors <= 6 ? 2 : 1)
