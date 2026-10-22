import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { DailyFlag } from '../progress'
import { useRound } from '../hooks'
import { sfx } from '../lib/sfx'
import { dayKey, hashStr } from '../lib/util'
import { SNIPPETS } from '../lib/snippets'
import { CHALLENGES, testLabel } from '../lib/challenges'
import { runCode } from '../lib/runner'
import { accuracy, initTyper, prepare, press, tilesLost, typingStars, wpm } from '../lib/typing'

export default function ScribeTower() {
  const [round, setRound] = useState(0)
  return (
    <Room
      title="Scribe Tower"
      lede="Type real algorithms to cut down the goblins, or write the function yourself and let the tests decide. Every slip lets the horde step closer."
      modes={[['type', 'Type the code'], ['write', 'Write the code']]}
    >
      {(mode) => (mode === 'type'
        ? <TypePlay key={`t${round}`} again={() => setRound((r) => r + 1)} />
        : <WritePlay key={`w${round}`} again={() => setRound((r) => r + 1)} />)}
    </Room>
  )
}

/* ---------- Type the code ---------- */

function TypePlay({ again }) {
  const daily = useContext(DailyFlag)
  const [sid, setSid] = useState(() => (daily ? SNIPPETS[hashStr(dayKey()) % SNIPPETS.length].id : SNIPPETS[0].id))
  const [lang, setLang] = useState('js')
  const snip = SNIPPETS.find((s) => s.id === sid)
  return <TypeRound key={`${sid}${lang}`} snip={snip} lang={lang} setLang={setLang} setSid={setSid} daily={daily} again={again} />
}

function TypeRound({ snip, lang, setLang, setSid, daily, again }) {
  const lines = useMemo(() => prepare(snip[lang]), [snip, lang])
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('type', lines.length, 4, 'Click the code and start typing. Indentation is filled in for you; press Enter at the end of each line.')
  const [s, setS] = useState(initTyper())
  const sRef = useRef(s)
  const stop = useRef(false)
  const area = useRef(null)
  const [flash, setFlash] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => { area.current && area.current.focus() }, [])
  useEffect(() => {
    if (s.start === null || over) return undefined
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [s.start, over])

  const feed = (text) => {
    for (const ch of text) {
      if (stop.current) return
      const prev = sRef.current
      const { s: n, ev } = press(lines, prev, ch)
      if (ev === 'none') return
      sRef.current = n
      setS(n)
      if (ev === 'err') {
        sfx('miss')
        setFlash(true)
        setTimeout(() => setFlash(false), 140)
        const lost = tilesLost(n.errors)
        if (lost > tilesLost(prev.errors)) {
          const dist = lane.max - lost
          laneSet(dist, n.li, false)
          say('The goblins take a step. Slow down and match each character.', 'bad')
          if (dist <= 0) {
            stop.current = true
            finish(false, 0, 'Too many slips. Accuracy matters more than speed: aim for clean lines first.', n.li, lost)
            return
          }
        }
      } else if (ev === 'line' || ev === 'done') {
        const dist = lane.max - tilesLost(n.errors)
        laneSet(dist, n.li, true)
        if (ev === 'done') {
          stop.current = true
          const e = n.errors
          finish(true, typingStars(e), `${snip.title} typed at ${wpm(n)} WPM with ${accuracy(n)}% accuracy. ${snip.blurb} (${snip.cx})`, lines.length, tilesLost(e), { wpm: wpm(n) })
          return
        }
        say(`Line ${n.li} of ${lines.length} done.`, 'ok')
      } else {
        sfx('tap')
      }
    }
  }

  const onInput = (e) => {
    const v = e.target.value
    e.target.value = ''
    if (!over) feed(v)
  }

  const cur = Math.min(s.li, lines.length - 1)
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <span className="chips" style={{ margin: 0 }} role="group" aria-label="Snippet">
            {SNIPPETS.map((x) => (
              <button key={x.id} className={`chip ${x.id === snip.id ? 'on' : ''}`} disabled={daily} onClick={() => setSid(x.id)}>{x.title}</button>
            ))}
          </span>
          <span className="chips" style={{ margin: 0 }} role="group" aria-label="Language">
            <button className={`chip ${lang === 'js' ? 'on' : ''}`} onClick={() => setLang('js')}>JavaScript</button>
            <button className={`chip ${lang === 'py' ? 'on' : ''}`} onClick={() => setLang('py')}>Python</button>
          </span>
        </div>
        <div
          className={`codebox ${flash ? 'flash' : ''}`}
          data-testid="codebox"
          onClick={() => area.current && area.current.focus()}
        >
          {lines.map((l, i) => (
            <div key={i} className={`cline ${i < s.li ? 'done' : i === s.li ? 'now' : ''}`} style={{ paddingLeft: `${l.indent}ch` }}>
              {i < s.li && l.text}
              {i === s.li && (
                <>
                  <span className="typed">{l.text.slice(0, s.ci)}</span>
                  <span className="caret">{l.text[s.ci] ?? '↵'}</span>
                  <span>{l.text.slice(s.ci + 1)}</span>
                </>
              )}
              {i > s.li && l.text}
            </div>
          ))}
          <textarea
            ref={area}
            className="typearea"
            aria-label="Type the code here"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            onInput={onInput}
            disabled={over}
          />
        </div>
        <div className="statrow" style={{ margin: '10px 0 6px' }}>
          <span>WPM <b data-testid="wpm">{wpm(s, now)}</b></span>
          <span>Accuracy <b>{accuracy(s)}%</b></span>
          <span>Slips <b data-testid="errors">{s.errors}</b></span>
          <span>Line <b>{Math.min(cur + 1, lines.length)}/{lines.length}</b></span>
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        <div className="row" style={{ marginTop: 8 }}>
          <HintButton disabled={over} onHint={() => hint(`${snip.blurb} Complexity ${snip.cx}. Focus on the shape of the loop, the rest follows.`)} />
          <button className="btn" onClick={() => area.current && area.current.focus()}>Focus typing</button>
        </div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

/* ---------- Write the code ---------- */

function WritePlay({ again }) {
  const daily = useContext(DailyFlag)
  const [cid, setCid] = useState(() => (daily ? CHALLENGES[hashStr(dayKey()) % CHALLENGES.length].id : CHALLENGES[0].id))
  const ch = CHALLENGES.find((c) => c.id === cid)
  return <WriteRound key={cid} ch={ch} setCid={setCid} daily={daily} again={again} />
}

function WriteRound({ ch, setCid, daily, again }) {
  const total = ch.tests.length
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('type', total, 5, 'Write the function, then press Run tests. A run that passes more tests than your best is free; a run that does not lets the goblins advance.')
  const [code, setCode] = useState(ch.starter)
  const [out, setOut] = useState(null)
  const [busy, setBusy] = useState(false)
  const [fails, setFails] = useState(0)
  const [best, setBest] = useState(0)
  const dist = useRef(lane.max)

  const run = async () => {
    if (busy || over) return
    setBusy(true)
    const r = await runCode(code, ch.fn, ch.tests)
    setBusy(false)
    setOut(r)
    if (r.compileError) {
      say(`Syntax or setup problem: ${r.compileError}`, 'bad')
      return
    }
    if (r.timeout) {
      const d = dist.current - 1
      dist.current = d
      setFails((f) => f + 1)
      laneSet(d, best, false)
      say('Timed out after 2.5 seconds. Your code is too slow or loops forever. Look for a faster approach.', 'bad')
      if (d <= 0) finish(false, 0, `Out of time. Idea: ${ch.hint}`, best, fails + 1)
      return
    }
    const passed = r.results.filter((x) => x.pass).length
    if (passed === total) {
      laneSet(dist.current, total, true)
      const f = fails
      finish(true, f === 0 ? 3 : f <= 2 ? 2 : 1, `All ${total} tests pass for ${ch.title} in ${f + 1} run${f ? 's' : ''}. Complexity of the textbook answer: ${ch.cx}.`, total, lane.max - dist.current)
      return
    }
    setFails((f) => f + 1)
    if (passed > best) {
      setBest(passed)
      laneSet(dist.current, passed, true)
      say(`${passed} of ${total} tests pass. Progress: the goblins hold.`, 'ok')
    } else {
      const d = dist.current - 1
      dist.current = d
      laneSet(d, best, false)
      say(`${passed} of ${total} tests pass. No progress, so the goblins advance.`, 'bad')
      if (d <= 0) finish(false, 0, `The tests still fail. Idea: ${ch.hint}`, best, lane.max)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const t = e.target
      const a = t.selectionStart
      const v = t.value
      const nv = v.slice(0, a) + '  ' + v.slice(t.selectionEnd)
      setCode(nv)
      requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = a + 2 })
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      run()
    }
  }

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="chips" style={{ marginTop: 0 }} role="group" aria-label="Challenge">
          {CHALLENGES.map((c) => (
            <button key={c.id} className={`chip ${c.id === ch.id ? 'on' : ''}`} disabled={daily} onClick={() => setCid(c.id)}>{c.title}</button>
          ))}
        </div>
        <p style={{ margin: '4px 0 10px' }}>{ch.brief}</p>
        <textarea
          className="editor"
          aria-label="Code editor"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={onKey}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={over}
          rows={Math.max(9, code.split('\n').length + 1)}
        />
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={run} disabled={busy || over}>{busy ? 'Running...' : 'Run tests'}</button>
          <HintButton disabled={over} onHint={() => hint(ch.hint)} />
          <button className="btn ghost" onClick={() => setCode(ch.starter)} disabled={over}>Reset code</button>
          <span className="statrow" style={{ margin: 0 }}>Best <b>{best}/{total}</b> · Failed runs <b>{fails}</b></span>
        </div>
        <div className={`msg ${msg.c}`} style={{ marginTop: 8 }}>{msg.t}</div>
        {out && !out.compileError && !out.timeout && (
          <ul className="tests" data-testid="tests">
            {ch.tests.map((t, i) => {
              const x = out.results[i]
              return (
                <li key={i} className={x && x.pass ? 'pass' : 'fail'}>
                  <span className="mark">{x && x.pass ? '✓' : '✗'}</span>
                  <span className="mono">{testLabel(ch, t)}</span>
                  {x && !x.pass && (
                    <span className="mono why">
                      {x.err ? `error: ${x.err}` : `got ${x.got}, want ${JSON.stringify(t.want)}`}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {over && (
          <details style={{ marginTop: 10 }}>
            <summary>Reference solution</summary>
            <pre className="codebox ref">{ch.solution}</pre>
          </details>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
