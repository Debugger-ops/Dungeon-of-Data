import { rand, shuffle } from './util'

// Word families share prefixes, so a trie built from them has plenty of reuse to spot.
export const FAMILIES = [
  ['cat', 'car', 'cart', 'care', 'card'],
  ['dog', 'dot', 'dote', 'do', 'dodo'],
  ['tap', 'tape', 'tip', 'tin', 'tint'],
  ['ban', 'band', 'bar', 'barn', 'bat'],
  ['sun', 'sung', 'sunk', 'run', 'rung'],
]

export const newNode = () => ({ c: {}, end: false })

// Insert a word and return how many NEW nodes it created (letters not already on the path).
export function insertWord(root, word) {
  let node = root
  let added = 0
  for (const ch of word) {
    if (!node.c[ch]) {
      node.c[ch] = newNode()
      added++
    }
    node = node.c[ch]
  }
  node.end = true
  return added
}

export const nodeCount = (root) => Object.values(root.c).reduce((t, n) => t + 1 + nodeCount(n), 0)

// Longest prefix of `word` already present in the trie.
export function sharedPrefix(root, word) {
  let node = root
  let i = 0
  while (i < word.length && node.c[word[i]]) {
    node = node.c[word[i]]
    i++
  }
  return word.slice(0, i)
}

export const countPrefix = (words, prefix) => words.filter((w) => w.startsWith(prefix)).length

// Two families mixed and shuffled, trimmed to n distinct words.
export function genWords(n = 6) {
  const a = rand(0, FAMILIES.length - 1)
  let b = rand(0, FAMILIES.length - 1)
  if (b === a) b = (b + 1) % FAMILIES.length
  return shuffle([...FAMILIES[a], ...FAMILIES[b]]).slice(0, n)
}

// Insert-mode script: for each word, the right answer is the number of new nodes it adds.
export function insertRun(words) {
  const root = newNode()
  return words.map((word) => {
    const shared = sharedPrefix(root, word)
    const added = insertWord(root, word)
    return {
      word,
      shared,
      added,
      total: nodeCount(root),
      why: shared
        ? added
          ? `"${shared}" is already on the path, so only the ${added} new letter${added === 1 ? '' : 's'} "${word.slice(shared.length)}" need nodes.`
          : `Every letter of "${word}" is already there (it is a prefix of an earlier word), so no new nodes. Only the end marker is set.`
        : `Nothing is shared with "${word}", so all ${added} letters need new nodes.`,
    }
  })
}

// Prefix-count puzzles: a prefix drawn from the stored words, and how many words start with it.
export function prefixPuzzle(words) {
  const base = words[rand(0, words.length - 1)]
  const prefix = base.slice(0, Math.min(rand(1, 2), base.length))
  return { prefix, answer: countPrefix(words, prefix) }
}
