import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { genWords, insertRun, insertWord, newNode, prefixPuzzle } from '../lib/trie'
import { rangeChoices } from '../lib/opts'
import { starsBad } from '../lib/util'

export default function TrieTunnel() {
  const [round, setRound] = useState(0)
  const again = () => setRound((r) => r + 1)
  return (
    <Room
      title="Trie Tunnel"
      lede="A trie stores words letter by letter, so words that start alike share the same tunnel. Count the new chambers each word digs, or count the words behind a prefix."
      modes={[['insert', 'Dig the tunnel'], ['prefix', 'Prefix search']]}
    >
      {(mode) => (mode === 'insert' ? <InsertPlay key={`i${round}`} again={again} /> : <PrefixPlay key={`p${round}`} again={again} />)}
    </Room>
  )
}

function Node({ n, ch, top }) {
  const keys = Object.keys(n.c).sort()
  return (
    <li>
      {!top && <span className={`tn ${n.end ? 'end' : ''}`}>{ch}</span>}
      {keys.length > 0 && <ul>{keys.map((k) => <Node key={k} n={n.c[k]} ch={k} />)}</ul>}
    </li>
  )
}

export const TrieView = ({ root, words }) => (
  <div className="trie" role="img" aria-label={`Trie holding: ${words.length ? words.join(', ') : 'nothing yet'}`}>
    {Object.keys(root.c).length === 0 ? <span className="fine">empty trie (just the root)</span> : <ul className="trie-root"><Node n={root} top /></ul>}
  </div>
)

function InsertPlay({ again }) {
  const words = useMemo(() => genWords(6), [])
  const run = useMemo(() => insertRun(words), [words])
  const [i, setI] = useState(0)
  const [bad, setBad] = useState(0)
  const [root] = useState(newNode)
  const [, force] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('trie', run.length, 4, 'Each word is inserted letter by letter. Letters already on the path are reused. How many new nodes does the next word create?')
  const cur = run[Math.min(i, run.length - 1)]
  const opts = useMemo(() => run.map((r) => rangeChoices(r.added, 0, r.word.length)), [run])

  const pick = (v) => {
    if (over) return
    if (v === cur.added) {
      insertWord(root, cur.word)
      force((x) => x + 1)
      const n = i + 1
      setI(n)
      laneSet(lane.dist, n, true)
      if (n >= run.length) return finish(true, starsBad(bad), `The finished trie has ${cur.total} nodes for ${words.length} words (${words.join('').length} letters). Sharing prefixes is why tries power autocomplete: lookup costs O(length of the word), not O(number of words).`, n, bad)
      say(cur.why, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, i, false)
      say(`Not ${v}. ${cur.why}`, 'bad')
      if (d <= 0) finish(false, 0, 'Walk down from the root as far as the letters already exist; only the remaining letters create nodes.', i, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <TrieView root={root} words={words.slice(0, i)} />
        <div className="statrow" style={{ margin: '10px 0 4px' }}>
          <span>Word <b>{Math.min(i + 1, run.length)}/{run.length}</b></span>
          <span>Inserting <b data-testid="trie-word">{cur.word}</b></span>
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        {!over && (
          <div className="row" style={{ marginTop: 8 }} role="group" aria-label="New nodes">
            <span className="fine" style={{ margin: 0 }}>New nodes?</span>
            {opts[Math.min(i, run.length - 1)].map((o) => <button key={o} className="btn optbtn" onClick={() => pick(o)}>{o}</button>)}
            <HintButton onHint={() => hint(`Start at the root and follow ${cur.word} while each letter already has a node. Count only the letters after that point.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function PrefixPlay({ again }) {
  const words = useMemo(() => genWords(8), [])
  const qs = useMemo(() => Array.from({ length: 4 }, () => prefixPuzzle(words)), [words])
  const root = useMemo(() => { const r = newNode(); words.forEach((w) => insertWord(r, w)); return r }, [words])
  const opts = useMemo(() => qs.map((q) => rangeChoices(q.answer, 0, words.length)), [qs, words])
  const [i, setI] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('trie', qs.length, 4, 'Walk to the end of the prefix, then count the words in the subtree below it (end markers are highlighted).')
  const q = qs[Math.min(i, qs.length - 1)]

  const pick = (v) => {
    if (over) return
    const matches = words.filter((w) => w.startsWith(q.prefix))
    if (v === q.answer) {
      const n = i + 1
      setI(n)
      laneSet(lane.dist, n, true)
      if (n >= qs.length) return finish(true, starsBad(bad), 'Prefix search follows the prefix down in O(length of the prefix), then collects whatever hangs below. A hash table cannot answer "everything starting with ca" without scanning every key.', n, bad)
      say(`"${q.prefix}" leads to ${q.answer}: ${matches.join(', ') || 'nothing'}.`, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, i, false)
      say(`Not ${v}. Words starting with "${q.prefix}": ${matches.join(', ') || 'none'}.`, 'bad')
      if (d <= 0) finish(false, 0, 'Follow the prefix letters from the root, then count the highlighted word endings below that node.', i, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <TrieView root={root} words={words} />
        <div className="statrow" style={{ margin: '10px 0 4px' }}>
          <span>Query <b>{Math.min(i + 1, qs.length)}/{qs.length}</b></span>
          <span>Prefix <b data-testid="trie-prefix">{q.prefix}</b></span>
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        {!over && (
          <div className="row" style={{ marginTop: 8 }} role="group" aria-label="Word count">
            <span className="fine" style={{ margin: 0 }}>How many words start with "{q.prefix}"?</span>
            {opts[Math.min(i, qs.length - 1)].map((o) => <button key={o} className="btn optbtn" onClick={() => pick(o)}>{o}</button>)}
            <HintButton onHint={() => hint(`Go to the "${q.prefix}" node and count the highlighted (word-ending) nodes at or below it.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
