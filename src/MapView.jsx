import { DIFFS, ROOMS } from './lib/rooms'
import { dailyRoom } from './Daily'
import { dayKey } from './lib/util'
import { stars } from './lib/util'
import { liveStreak, useProgress } from './progress'
import { LEVELS, clearedCount, totalStars } from './lib/campaign'

const ICONS = {
  list: (<><rect x="6" y="24" width="24" height="16" /><rect x="50" y="24" width="24" height="16" /><rect x="94" y="24" width="24" height="16" /><path d="M30 32h20M74 32h20" style={{ stroke: 'var(--torch)', strokeWidth: 3 }} /></>),
  bits: (<><rect x="6" y="22" width="12" height="20" /><rect x="22" y="22" width="12" height="20" style={{ fill: 'var(--torch)' }} /><rect x="38" y="22" width="12" height="20" /><rect x="54" y="22" width="12" height="20" style={{ fill: 'var(--torch)' }} /><rect x="70" y="22" width="12" height="20" /><rect x="86" y="22" width="12" height="20" /><rect x="102" y="22" width="12" height="20" style={{ fill: 'var(--torch)' }} /></>),
  bigo: (<><path d="M8 54 Q40 52 62 34 T116 8" fill="none" style={{ stroke: 'var(--torch)', strokeWidth: 3 }} /><path d="M8 54 L116 54" /></>),
  window: (<><rect x="6" y="26" width="20" height="20" /><rect x="30" y="26" width="20" height="20" /><rect x="54" y="26" width="20" height="20" /><rect x="78" y="26" width="20" height="20" /><rect x="28" y="22" width="48" height="28" fill="none" style={{ stroke: 'var(--torch)', strokeWidth: 3 }} /></>),
  memory: (<><rect x="8" y="10" width="24" height="20" /><rect x="40" y="10" width="24" height="20" style={{ fill: 'var(--torch)' }} /><rect x="72" y="10" width="24" height="20" /><rect x="8" y="36" width="24" height="20" /><rect x="40" y="36" width="24" height="20" /><rect x="72" y="36" width="24" height="20" style={{ fill: 'var(--torch)' }} /></>),
  stackdef: (<><rect x="34" y="42" width="56" height="12" /><rect x="34" y="28" width="56" height="12" /><rect x="34" y="14" width="56" height="12" style={{ fill: 'var(--torch)' }} /></>),
  bug: (<><ellipse cx="62" cy="34" rx="16" ry="20" /><circle cx="62" cy="12" r="7" /><path d="M46 26 L30 18 M46 36 L28 36 M46 46 L30 54 M78 26 L94 18 M78 36 L96 36 M78 46 L94 54" fill="none" /></>),
  graphb: (<><circle cx="20" cy="46" r="8" /><circle cx="62" cy="14" r="8" style={{ fill: 'var(--torch)' }} /><circle cx="104" cy="46" r="8" /><path d="M26 41 L56 19 M68 19 L98 41 M28 46 L96 46" fill="none" /></>),
  type: (<><rect x="6" y="12" width="112" height="40" rx="4" /><path d="M18 26h22M46 26h14M18 38h30M54 38h18" style={{ stroke: 'var(--torch)', strokeWidth: 3 }} /></>),
  sort: (<><rect x="10" y="30" width="14" height="28" /><rect x="30" y="14" width="14" height="44" /><rect x="50" y="38" width="14" height="20" /><rect x="70" y="22" width="14" height="36" /><rect x="90" y="46" width="14" height="12" /></>),
  bsearch: (<><rect x="6" y="26" width="22" height="32" /><rect x="34" y="26" width="22" height="32" /><rect x="62" y="26" width="22" height="32" style={{ fill: 'var(--torch)' }} /><rect x="90" y="26" width="22" height="32" /></>),
  keep: (<><rect x="8" y="42" width="40" height="14" /><rect x="8" y="26" width="40" height="14" /><rect x="8" y="10" width="40" height="14" /><rect x="62" y="30" width="16" height="16" /><rect x="82" y="30" width="16" height="16" /><rect x="102" y="30" width="16" height="16" /></>),
  crypt: (<><circle cx="60" cy="14" r="8" /><circle cx="34" cy="36" r="8" /><circle cx="86" cy="36" r="8" /><circle cx="20" cy="56" r="7" /><circle cx="48" cy="56" r="7" /><circle cx="100" cy="56" r="7" /></>),
  hash: (<><rect x="6" y="8" width="22" height="12" /><rect x="6" y="26" width="22" height="12" /><rect x="6" y="44" width="22" height="12" /><rect x="36" y="8" width="16" height="12" /><rect x="58" y="8" width="16" height="12" /><rect x="36" y="44" width="16" height="12" style={{ fill: 'var(--torch)' }} /></>),
  dp: (<><rect x="8" y="10" width="20" height="14" /><rect x="32" y="10" width="20" height="14" /><rect x="56" y="10" width="20" height="14" style={{ fill: 'var(--torch)' }} /><rect x="8" y="30" width="20" height="14" /><rect x="32" y="30" width="20" height="14" /><rect x="56" y="30" width="20" height="14" /><rect x="8" y="50" width="20" height="10" /><rect x="32" y="50" width="20" height="10" /></>),
  maze: (<><circle cx="16" cy="32" r="8" /><circle cx="52" cy="12" r="8" /><circle cx="52" cy="52" r="8" /><circle cx="92" cy="32" r="8" /><circle cx="116" cy="12" r="6" /></>),
}

export default function MapView() {
  const { S, go, setDifficulty } = useProgress()
  const today = dayKey()
  const dr = dailyRoom(today)
  const done = S.daily.date === today && S.daily.done
  const streak = liveStreak(S)
  return (
    <>
      <div className="grid2">
        <button className="card daily" onClick={() => go('daily')}>
          <h3>Daily Challenge</h3>
          <div className="sub">{done ? `Cleared today. Come back tomorrow for the next room.` : `Today: ${dr.name}. Win for bonus XP.`}</div>
          <div className="statrow" style={{ margin: '8px 0 0' }}>
            <span>Streak <b>{streak}</b></span>
            <span>Best <b>{S.streak.best}</b></span>
            <span><b style={{ color: done ? 'var(--ok)' : 'var(--torch)' }}>{done ? 'cleared' : 'open'}</b></span>
          </div>
        </button>
        <div className="card">
          <h3>Difficulty</h3>
          <div className="chips" style={{ margin: '8px 0 6px' }}>
            {Object.entries(DIFFS).map(([k, d]) => (
              <button key={k} className={`opt ${S.difficulty === k ? 'on' : ''}`} onClick={() => setDifficulty(k)}>{d.label}</button>
            ))}
          </div>
          <div className="sub" style={{ color: 'var(--mut)', fontSize: 13 }}>{DIFFS[S.difficulty].note}. Applies to new rounds in every room.</div>
        </div>
      </div>
      <div className="card">
        <div className="steps">
          <div><b>Goblins march</b>Every room has a lane. A wrong move lets the horde step closer to your keep.</div>
          <div><b>You think like the algorithm</b>Predict its next step, then watch the structure change. Correct moves slay goblins.</div>
          <div><b>Stars measure efficiency</b>Fewer mistakes and fewer swaps earn more stars and XP.</div>
        </div>
      </div>
      <div className="rooms">
        {ROOMS.map((r, i) => {
          const x = S.rooms[r.id]
          return (
            <button key={r.id} className="room" onClick={() => go(r.id)}>
              <svg viewBox="0 0 124 64" style={{ fill: 'var(--panel2)', stroke: 'var(--mut)', strokeWidth: 1.5 }} aria-hidden="true">{ICONS[r.id]}</svg>
              <h3>{i + 1}. {r.name}</h3>
              <div className="sub">{r.sub}</div>
              <div className="meta"><span className="st">{stars(x.stars)}</span><span>{x.wins} wins · {x.tries} tries</span></div>
            </button>
          )
        })}
        <button className="room" onClick={() => go('camp')}>
          <svg viewBox="0 0 124 64" style={{ fill: 'none', stroke: 'var(--torch)', strokeWidth: 2.5 }} aria-hidden="true">
            <path d="M10 52 L34 40 L58 46 L82 22 L112 12" strokeDasharray="5 4" />
            <circle cx="10" cy="52" r="5" style={{ fill: 'var(--ok)' }} /><circle cx="34" cy="40" r="5" style={{ fill: 'var(--ok)' }} /><circle cx="58" cy="46" r="5" style={{ fill: 'var(--panel2)' }} /><circle cx="82" cy="22" r="5" style={{ fill: 'var(--panel2)' }} /><circle cx="112" cy="12" r="6" style={{ fill: 'var(--bad)' }} />
          </svg>
          <h3>Campaign</h3>
          <div className="sub">20 levels in 4 worlds. Fixed puzzles, rising difficulty, new levels unlock as you win</div>
          <div className="meta"><span>{clearedCount(S.campaign.stars)}/{LEVELS.length} cleared</span><span>{totalStars(S.campaign.stars)} stars</span></div>
        </button>
        <button className="room" onClick={() => go('rush')}>
          <svg viewBox="0 0 124 64" style={{ fill: 'none', stroke: 'var(--bad)', strokeWidth: 2.5 }} aria-hidden="true">
            <path d="M10 52 L30 12 L50 36 L70 12 L90 36 L114 8" />
            <path d="M10 56 H114" style={{ stroke: 'var(--mut)', strokeWidth: 1.5 }} />
          </svg>
          <h3>Boss Rush</h3>
          <div className="sub">Three random rooms back to back for a big bonus: how far can you get?</div>
          <div className="meta"><span>bonus XP</span><span>3 rooms</span></div>
        </button>
        <button className="room" onClick={() => go('quiz')}>
          <svg viewBox="0 0 124 64" style={{ fill: 'none', stroke: 'var(--arc)', strokeWidth: 2.5 }} aria-hidden="true">
            <rect x="14" y="8" width="96" height="14" rx="3" />
            <rect x="14" y="28" width="96" height="14" rx="3" style={{ stroke: 'var(--torch)' }} />
            <rect x="14" y="48" width="96" height="10" rx="3" />
          </svg>
          <h3>Scholar's Quiz</h3>
          <div className="sub">Short Big-O and concept questions, aimed at the rooms where you slip most</div>
          <div className="meta"><span>{S.quiz.taken} taken</span><span>{S.quiz.perfect} perfect</span></div>
        </button>
        <button className="room" onClick={() => go('lab')}>
          <svg viewBox="0 0 124 64" style={{ fill: 'none', strokeWidth: 2.5 }} aria-hidden="true">
            <path d="M6 58 H120 M6 58 V4" style={{ stroke: 'var(--mut)', strokeWidth: 1.5 }} />
            <polyline points="10,52 40,44 70,30 100,12 118,6" style={{ stroke: 'var(--bad)' }} />
            <polyline points="10,52 40,48 70,42 100,34 118,30" style={{ stroke: 'var(--ok)' }} />
            <polyline points="10,52 40,50 70,49 100,48 118,47" style={{ stroke: 'var(--arc)' }} />
          </svg>
          <h3>Analytics</h3>
          <div className="sub">Radar, XP trend, activity heatmap, plus measured sorting, BST and hash-table growth charts</div>
          <div className="meta"><span>charts</span><span>{Object.keys(S.activity || {}).length} active days</span></div>
        </button>
        <button className="room" onClick={() => go('tome')}>
          <svg viewBox="0 0 124 64" style={{ fill: 'none', stroke: 'var(--torch)', strokeWidth: 2.5 }} aria-hidden="true">
            <path d="M6 58 C40 58 60 54 80 40 S110 8 120 4" />
            <path d="M6 58 H120" style={{ stroke: 'var(--mut)' }} />
          </svg>
          <h3>Tome of Growth</h3>
          <div className="sub">Big-O chart with exact counts, plus reference tables for every structure here</div>
          <div className="meta"><span>reference</span><span /></div>
        </button>
      </div>
    </>
  )
}
