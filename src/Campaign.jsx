import { useEffect, useState } from 'react'
import { useProgress } from './progress'
import { DIFFS, ROOMS } from './lib/rooms'
import { LEVELS, WORLDS, clearedCount, isOpen, levelById, nextLevel, totalStars, worldDone } from './lib/campaign'
import { hashStr, seedRng, stars, unseedRng } from './lib/util'
import { ROOM_COMPONENTS } from './Daily'
import { LevelFlag } from './level'

export default function Campaign() {
  const { S, go, recordLevel } = useProgress()
  const [cur, setCur] = useState(null) // level id being played
  const [attempt, setAttempt] = useState(0)
  const st = S.campaign.stars

  if (cur) {
    const level = levelById(cur)
    return (
      <LevelPlay
        key={`${cur}:${attempt}`}
        level={level}
        stars={st[cur] || 0}
        ctx={{
          level,
          record: (n) => recordLevel(level.id, n),
          next: () => { const n = nextLevel(level.id); setCur(n ? n.id : null); setAttempt((a) => a + 1) },
          retry: () => setAttempt((a) => a + 1),
          back: () => setCur(null),
        }}
      />
    )
  }

  return (
    <>
      <div className="roomhead">
        <div>
          <h2>Campaign</h2>
          <p className="lede">Twenty levels across four worlds. Every level is a fixed puzzle at a set difficulty, and clearing it unlocks the next. Earn bonus XP the first time you clear a level and for every star you add.</p>
        </div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      <div className="card">
        <div className="statrow" style={{ margin: 0 }}>
          <span>Levels cleared <b data-testid="camp-cleared">{clearedCount(st)}/{LEVELS.length}</b></span>
          <span>Stars <b>{totalStars(st)}/{LEVELS.length * 3}</b></span>
        </div>
      </div>
      {WORLDS.map((w) => (
        <section key={w.id} className="card world" aria-label={`World ${w.id}: ${w.name}`}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>World {w.id}: {w.name}</h3>
            <span className="fine" style={{ margin: 0 }}>{worldDone(w, st) ? 'World cleared' : `${w.levels.filter((l) => (st[`${w.id}-${l.n}`] || 0) >= 1).length}/${w.levels.length} cleared`}</span>
          </div>
          <p className="fine" style={{ marginTop: 2 }}>{w.blurb}</p>
          <div className="lvls">
            {w.levels.map((l) => {
              const id = `${w.id}-${l.n}`
              const open = isOpen(id, st)
              const s = st[id] || 0
              const room = ROOMS.find((r) => r.id === l.room)
              return (
                <button key={id} className={`lvl ${open ? '' : 'locked'} ${s ? 'done' : ''} ${l.n === 5 ? 'boss' : ''}`} disabled={!open} onClick={() => setCur(id)}
                  aria-label={open ? `Level ${id}, ${l.name}, ${room.name}, ${DIFFS[l.diff].label}, ${s} of 3 stars` : `Level ${id}, locked`}>
                  <b>{id}</b>
                  <span className="ln2">{open ? l.name : 'Locked'}</span>
                  <small>{open ? `${room.name} · ${DIFFS[l.diff].label}` : 'Clear the previous level'}</small>
                  <span className="st">{open ? stars(s) : '—'}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}

function LevelPlay({ level, stars: best, ctx }) {
  // A level is the same puzzle every time: the random source is seeded by the level id.
  seedRng(hashStr(`level:${level.id}`))
  useEffect(() => () => unseedRng(), [])
  const View = ROOM_COMPONENTS[level.room]
  const room = ROOMS.find((r) => r.id === level.room)
  return (
    <>
      <div className="card">
        <div className="statrow" style={{ margin: 0 }}>
          <span>Level <b data-testid="level-id">{level.id}</b></span>
          <span><b>{level.name}</b></span>
          <span>{room.name}</span>
          <span>Difficulty <b>{DIFFS[level.diff].label}</b></span>
          <span>Best <b>{best ? stars(best) : 'not cleared'}</b></span>
        </div>
        <p className="fine" style={{ marginBottom: 0 }}>Tip: {level.tip}</p>
      </div>
      <LevelFlag.Provider value={ctx}>
        <View />
      </LevelFlag.Provider>
    </>
  )
}
