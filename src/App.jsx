import { Component, useEffect, useRef, useState } from 'react'
import { liveStreak, useProgress } from './progress'
import { AccountProvider, Avatar, useAccount } from './accounts'
import AccountView from './AccountView'
import SettingsView from './SettingsView'
import { SettingsProvider, useSettings } from './settings'
import { RANKS } from './lib/rooms'
import MapView from './MapView'
import Tome from './Tome'
import Ledger from './Ledger'
import SortingHall from './rooms/SortingHall'
import BinaryVault from './rooms/BinaryVault'
import TheKeep from './rooms/TheKeep'
import RootCrypt from './rooms/RootCrypt'
import GraphLabyrinth from './rooms/GraphLabyrinth'
import HashForge from './rooms/HashForge'
import DPDungeon from './rooms/DPDungeon'
import ScribeTower from './rooms/ScribeTower'
import LinkedListLab from './rooms/LinkedListLab'
import BitBunker from './rooms/BitBunker'
import BigOBlitz from './rooms/BigOBlitz'
import PatternMatch from './rooms/PatternMatch'
import MemoryMatch from './rooms/MemoryMatch'
import StackDefender from './rooms/StackDefender'
import BugHunt from './rooms/BugHunt'
import GraphBuilder from './rooms/GraphBuilder'
import TrieTunnel from './rooms/TrieTunnel'
import UnionYard from './rooms/UnionYard'
import BacktrackBastion from './rooms/BacktrackBastion'
import HeapHollow from './rooms/HeapHollow'
import Weekly from './Weekly'
import Endless from './Endless'
import Speedrun from './Speedrun'
import Race from './Race'
import Review from './Review'
import Interview from './Interview'
import Visualizer from './Visualizer'
import Shop from './Shop'
import Challenge, { incoming } from './Challenge'
import CheatSheet from './CheatSheet'
import Tutorial from './Tutorial'
import { tr } from './lib/i18n'
import Daily from './Daily'
import Quiz from './Quiz'
import Analytics from './Analytics'
import Leaderboard from './Leaderboard'
import BossRush from './BossRush'
import Campaign from './Campaign'
import { CloudProvider } from './cloud'
import { dayKey } from './lib/util'

const VIEWS = { map: MapView, sort: SortingHall, bsearch: BinaryVault, keep: TheKeep, crypt: RootCrypt, maze: GraphLabyrinth, hash: HashForge, dp: DPDungeon, type: ScribeTower, list: LinkedListLab, bits: BitBunker, bigo: BigOBlitz, window: PatternMatch, memory: MemoryMatch, stackdef: StackDefender, bug: BugHunt, graphb: GraphBuilder, trie: TrieTunnel, union: UnionYard, back: BacktrackBastion, heap: HeapHollow, weekly: Weekly, endless: Endless, speed: Speedrun, race: Race, review: Review, interview: Interview, viz: Visualizer, shop: Shop, challenge: Challenge, cheat: CheatSheet, camp: Campaign, daily: Daily, rush: BossRush, board: Leaderboard, quiz: Quiz, lab: Analytics, account: AccountView, settings: SettingsView, tome: Tome, ledger: Ledger }
const GROUPS = [
  ['Play', [['map', 'Map'], ['camp', 'Campaign'], ['daily', 'Daily'], ['rush', 'Boss Rush'], ['weekly', 'Weekly'], ['challenge', 'Challenge'], ['endless', 'Endless'], ['speed', 'Speedrun'], ['race', 'Sorting Race']]],
  ['Arrays and search', [['sort', 'Sorting Hall'], ['bsearch', 'Binary Vault'], ['window', 'Pattern Match'], ['bits', 'Bit Bunker'], ['bigo', 'Big-O Blitz']]],
  ['Lists and stacks', [['list', 'Linked List Lab'], ['keep', 'The Keep'], ['stackdef', 'Stack Defender'], ['hash', 'Hash Forge'], ['trie', 'Trie Tunnel'], ['union', 'Union Yard'], ['back', 'Backtrack Bastion'], ['heap', 'Heap Hollow']]],
  ['Trees and graphs', [['crypt', 'Root Crypt'], ['maze', 'Labyrinth'], ['graphb', 'Graph Builder'], ['dp', 'DP Dungeon']]],
  ['Skills', [['type', 'Scribe Tower'], ['bug', 'Bug Hunt'], ['memory', 'Memory Match']]],
  ['Progress', [['board', 'Leaderboard'], ['quiz', 'Quiz'], ['review', 'Review'], ['interview', 'Interview'], ['viz', 'Visualizer'], ['cheat', 'Cheat sheet'], ['shop', 'Shop'], ['lab', 'Analytics'], ['tome', 'Tome'], ['ledger', 'Ledger'], ['settings', 'Settings']]],
]
const NAV = GROUPS.flatMap((g) => g[1])

class Boundary extends Component {
  state = { err: null }
  static getDerivedStateFromError(err) {
    return { err }
  }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="card" role="alert">
        <h3>Something went wrong in this room</h3>
        <p className="fine">Your progress is saved and safe. Try again, or go back to the map.</p>
        <div className="row">
          <button className="btn primary" onClick={() => this.setState({ err: null })}>Try again</button>
          <button className="btn" onClick={() => this.props.onMap()}>Back to map</button>
        </div>
        <details style={{ marginTop: 8 }}><summary>Technical details</summary><pre className="codebox ref">{String(this.state.err && this.state.err.message)}</pre></details>
      </div>
    )
  }
}

const useOnline = () => {
  const [on, setOn] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const a = () => setOn(true)
    const b = () => setOn(false)
    window.addEventListener('online', a)
    window.addEventListener('offline', b)
    return () => {
      window.removeEventListener('online', a)
      window.removeEventListener('offline', b)
    }
  }, [])
  return on
}

// 1-4 pick an answer, H asks for a hint, N / Enter continues past a result card.
function useShortcuts() {
  useEffect(() => {
    const on = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      const k = e.key.toLowerCase()
      const click = (el) => { if (el && !el.disabled) { e.preventDefault(); el.click() } }
      if (/^[1-4]$/.test(k)) {
        const opts = [...document.querySelectorAll('main .quizopts .qopt, main .optbtn')].filter((b) => !b.disabled)
        click(opts[Number(k) - 1])
      } else if (k === 'h') click([...document.querySelectorAll('main button[title^="A hint"]')][0])
      else if (k === 'n') click(document.querySelector('.result .btn.primary'))
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])
}

function Shell() {
  const { S, view, go } = useProgress()
  useShortcuts()
  const { profile } = useAccount()
  const { sound, toggleSound, lang, remind } = useSettings()
  useEffect(() => { if (incoming) go('challenge') }, [])
  useEffect(() => {
    if (!remind || typeof Notification === 'undefined') return
    const check = () => {
      const day = dayKey()
      let sent = ''
      try { sent = localStorage.getItem('dod-remind-day') } catch (e) { /* ignore */ }
      if (Notification.permission === 'granted' && new Date().getHours() >= 18 && sent !== day && liveStreak(S) > 0 && !(S.daily.date === day && S.daily.done)) {
        new Notification('Dungeon of Data', { body: `Your ${liveStreak(S)}-day streak ends tonight. Clear today's daily challenge!` })
        try { localStorage.setItem('dod-remind-day', day) } catch (e) { /* ignore */ }
      }
    }
    check()
    const t = setInterval(check, 600000)
    return () => clearInterval(t)
  }, [remind, S])
  const View = VIEWS[view]
  const online = useOnline()
  const mainRef = useRef(null)
  const first = useRef(true)
  useEffect(() => {
    window.scrollTo(0, 0)
    const label = (NAV.find((n) => n[0] === view) || [0, view === 'account' ? 'Account' : 'Map'])[1]
    document.title = view === 'map' ? 'Dungeon of Data' : `${label} | Dungeon of Data`
    // Move keyboard and screen-reader focus to the new page, but not on first load.
    if (first.current) first.current = false
    else if (mainRef.current) mainRef.current.focus({ preventScroll: true })
  }, [view])

  let ri = 0
  RANKS.forEach((r, i) => {
    if (S.xp >= r[0]) ri = i
  })
  const cur = RANKS[ri]
  const nx = RANKS[ri + 1]
  const pct = nx ? Math.min(100, ((S.xp - cur[0]) / (nx[0] - cur[0])) * 100) : 100

  return (
    <div className="wrap">
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current && mainRef.current.focus() }}>Skip to content</a>
      {view === 'map' && liveStreak(S) > 0 && !(S.daily.date === dayKey() && S.daily.done) && new Date().getHours() >= 17 && (
        <div className="offline reminder" role="status">Your {liveStreak(S)}-day streak ends tonight. <button className="btn" onClick={() => go('daily')}>Clear today's daily</button></div>
      )}
      {!online && <div className="offline" role="status">You are offline. Everything still works; cloud sync resumes when you reconnect.</div>}
      <Tutorial />
      <div className="top">
        <div className="brand">
          <h1>Dungeon of Data</h1>
          <small>Defend the keep by thinking like an algorithm</small>
        </div>
        <button className={`who ${view === 'account' ? 'on' : ''}`} onClick={() => go('account')} aria-label={`Account: ${profile.name}`}>
          <span className={`frame ${S.frame}`}><Avatar p={profile} size={28} /></span>
          <span>{profile.name}</span>
        </button>
        <button className="who mute" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Sound on, click to mute' : 'Sound off, click to unmute'}>
          <span>Sound {sound ? 'on' : 'off'}</span>
        </button>
        <div className="rank">
          <div className="rt"><b>{cur[1]}</b><span>{nx ? `${S.xp} / ${nx[0]} XP` : `${S.xp} XP · max rank`}</span></div>
          <div className="meter"><i style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
      <div className="shell">
        <nav className="nav" aria-label="Rooms">
          {GROUPS.map(([g, items]) => (
            <div className="ngrp" role="group" aria-label={g} key={g}>
              <span className="nlab" aria-hidden="true">{tr(lang, g)}</span>
              {items.map(([k, label]) => (
                <button key={k} className={k === view ? 'on' : ''} aria-current={k === view ? 'page' : undefined} onClick={() => go(k)}>{tr(lang, label)}</button>
              ))}
            </div>
          ))}
        </nav>
        <main className="main" id="main" tabIndex={-1} ref={mainRef}>
          <Boundary key={view} onMap={() => go('map')}>
            <View />
          </Boundary>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <AccountProvider>
        <CloudProvider>
          <Shell />
        </CloudProvider>
      </AccountProvider>
    </SettingsProvider>
  )
}
