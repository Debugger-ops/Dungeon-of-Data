import { useRef, useState } from 'react'
import { drawCard } from './lib/card'
import { shopItem } from './lib/shop'
import { Avatar } from './accounts'
import { ACHIEVEMENTS } from './lib/achievements'
import { RANKS, ROOMS } from './lib/rooms'
import { totalStars, LEVELS } from './lib/campaign'
import { liveStreak, useProgress } from './progress'

export const rankOf = (xp) => {
  let i = 0
  RANKS.forEach((r, k) => { if (xp >= r[0]) i = k })
  return { i, name: RANKS[i][1], next: RANKS[i + 1] || null, floor: RANKS[i][0] }
}

// Player card: rank, chosen title, headline stats, strongest rooms and the badge shelf.
export default function HeroCard({ p }) {
  const { S, setTitle } = useProgress()
  const [note, setNote] = useState('')
  const cv = useRef(null)
  const rk = rankOf(S.xp)
  const wins = ROOMS.reduce((t, r) => t + S.rooms[r.id].wins, 0)
  const tries = ROOMS.reduce((t, r) => t + S.rooms[r.id].tries, 0)
  const ok = ROOMS.reduce((t, r) => t + S.rooms[r.id].ok, 0)
  const bad = ROOMS.reduce((t, r) => t + S.rooms[r.id].bad, 0)
  const acc = ok + bad ? Math.round((100 * ok) / (ok + bad)) : 0
  const pct = rk.next ? Math.min(100, ((S.xp - rk.floor) / (rk.next[0] - rk.floor)) * 100) : 100
  const mastery = ROOMS.map((r) => {
    const x = S.rooms[r.id]
    const t = x.ok + x.bad
    return { id: r.id, name: r.name, m: Math.round(((t ? x.ok / t : 0) * 0.6 + (x.stars / 3) * 0.4) * 100), played: x.tries > 0 }
  }).filter((x) => x.played).sort((a, b) => b.m - a.m)
  const owned = ACHIEVEMENTS.filter((a) => S.ach[a.id])
  const days = S.since ? Math.max(1, Math.round((Date.now() - new Date(S.since + 'T00:00:00').getTime()) / 86400000) + 1) : 1
  const stats = [
    ['Wins', wins], ['Win rate', tries ? `${Math.round((100 * wins) / tries)}%` : '—'], ['Accuracy', ok + bad ? `${acc}%` : '—'],
    ['Best streak', S.streak.best], ['Campaign stars', `${totalStars(S.campaign.stars)}/${LEVELS.length * 3}`], ['Quests done', S.questsDone],
    ['Quizzes', S.quiz.taken], ['Days playing', days],
  ]
  const png = () => {
    drawCard(cv.current, { name: p.name, title: S.title, rank: rk.name, xp: S.xp, wins, badges: owned.length, badgeTotal: ACHIEVEMENTS.length, streak: liveStreak(S), color: p.color, pct, next: rk.next ? `${rk.next[0] - S.xp} XP to ${rk.next[1]}` : '' })
    cv.current.toBlob((b) => {
      if (!b) return setNote('Could not make the image')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b)
      a.download = `dungeon-of-data-${p.name.replace(/\W+/g, '-').toLowerCase()}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
      setNote('Card image saved')
    }, 'image/png')
  }
  const copy = async () => {
    const text = `${p.name}${S.title ? ', ' + S.title : ''} | ${rk.name} | ${S.xp} XP | ${wins} wins | ${owned.length}/${ACHIEVEMENTS.length} badges | streak ${liveStreak(S)} on Dungeon of Data\n${location.origin + location.pathname}`
    try {
      await navigator.clipboard.writeText(text)
      setNote('Hero card copied')
    } catch (e) {
      setNote('Could not copy')
    }
  }
  return (
    <div className="card herocard">
      <div className="row" style={{ gap: 16, alignItems: 'center' }}>
        <span className={`frame ${S.frame}`}><Avatar p={p} size={72} /></span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h3 style={{ fontSize: 22 }}>{p.name}</h3>
          <div className="hero-title">{S.title || 'Untitled adventurer'} · {rk.name}</div>
          <div className="rt" style={{ marginTop: 8 }}><span>{rk.next ? `${S.xp} / ${rk.next[0]} XP to ${rk.next[1]}` : `${S.xp} XP · max rank`}</span></div>
          <div className="meter" role="img" aria-label={`${Math.round(pct)}% of the way to the next rank`}><i style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
      <div className="hero-stats">
        {stats.map(([k, v]) => <div key={k}><b>{v}</b><small>{k}</small></div>)}
      </div>
      <div className="grid2" style={{ marginTop: 12 }}>
        <div>
          <h4 className="hero-h">Strongest rooms</h4>
          {mastery.length === 0 && <p className="fine">Play a round to see your mastery here.</p>}
          {mastery.slice(0, 5).map((x) => (
            <div key={x.id} className="mrow"><span>{x.name}</span><div className="meter"><i style={{ width: `${x.m}%` }} /></div><b>{x.m}%</b></div>
          ))}
        </div>
        <div>
          <h4 className="hero-h">Title</h4>
          <label className="field" style={{ marginBottom: 8 }}>Shown on your hero card
            <select className="input" value={S.title} onChange={(e) => setTitle(e.target.value)} aria-label="Title">
              <option value="">No title</option>
              {owned.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
              {S.owned.map(shopItem).filter((x) => x && x.kind === 'title').map((x) => <option key={x.id} value={x.name}>{x.name}</option>)}
            </select>
          </label>
          <p className="fine">Titles come from achievements you unlock and from the Shop.</p>
          <div className="row"><button className="btn" onClick={copy}>Copy hero card</button><button className="btn" onClick={png}>Download card image</button></div>
          <canvas ref={cv} hidden />
          <span className="fine" role="status" aria-live="polite" style={{ marginLeft: 8 }}>{note}</span>
        </div>
      </div>
      <h4 className="hero-h" style={{ marginTop: 12 }}>Badge shelf ({owned.length}/{ACHIEVEMENTS.length})</h4>
      <div className="shelf">
        {ACHIEVEMENTS.map((a) => <span key={a.id} className={`badge ${S.ach[a.id] ? 'on' : ''}`} title={`${a.name}: ${a.desc}`}>{S.ach[a.id] ? a.name : '???'}</span>)}
      </div>
    </div>
  )
}
