import { Component, useEffect, useRef, useState } from 'react'
import { useProgress } from './progress'
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
import Daily from './Daily'
import Quiz from './Quiz'
import Analytics from './Analytics'
import Leaderboard from './Leaderboard'
import BossRush from './BossRush'
import Campaign from './Campaign'
import { CloudProvider } from './cloud'

const VIEWS = { map: MapView, sort: SortingHall, bsearch: BinaryVault, keep: TheKeep, crypt: RootCrypt, maze: GraphLabyrinth, hash: HashForge, dp: DPDungeon, type: ScribeTower, list: LinkedListLab, bits: BitBunker, bigo: BigOBlitz, window: PatternMatch, memory: MemoryMatch, stackdef: StackDefender, bug: BugHunt, graphb: GraphBuilder, camp: Campaign, daily: Daily, rush: BossRush, board: Leaderboard, quiz: Quiz, lab: Analytics, account: AccountView, settings: SettingsView, tome: Tome, ledger: Ledger }
const NAV = [['map', 'Map'], ['camp', 'Campaign'], ['sort', 'Sorting Hall'], ['bsearch', 'Binary Vault'], ['keep', 'The Keep'], ['crypt', 'Root Crypt'], ['maze', 'Labyrinth'], ['hash', 'Hash Forge'], ['dp', 'DP Dungeon'], ['type', 'Scribe Tower'], ['list', 'Linked List Lab'], ['bits', 'Bit Bunker'], ['bigo', 'Big-O Blitz'], ['window', 'Pattern Match'], ['memory', 'Memory Match'], ['stackdef', 'Stack Defender'], ['bug', 'Bug Hunt'], ['graphb', 'Graph Builder'], ['daily', 'Daily'], ['rush', 'Boss Rush'], ['board', 'Leaderboard'], ['quiz', 'Quiz'], ['lab', 'Analytics'], ['tome', 'Tome'], ['ledger', 'Ledger'], ['settings', 'Settings']]

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

function Shell() {
  const { S, view, go } = useProgress()
  const { profile } = useAccount()
  const { sound, toggleSound } = useSettings()
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
      {!online && <div className="offline" role="status">You are offline. Everything still works; cloud sync resumes when you reconnect.</div>}
      <div className="top">
        <div className="brand">
          <h1>Dungeon of Data</h1>
          <small>Defend the keep by thinking like an algorithm</small>
        </div>
        <button className={`who ${view === 'account' ? 'on' : ''}`} onClick={() => go('account')} aria-label={`Account: ${profile.name}`}>
          <Avatar p={profile} size={28} />
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
      <nav className="nav" aria-label="Rooms">
        {NAV.map(([k, label]) => (
          <button key={k} className={k === view ? 'on' : ''} aria-current={k === view ? 'page' : undefined} onClick={() => go(k)}>{label}</button>
        ))}
      </nav>
      <main className="main" id="main" tabIndex={-1} ref={mainRef}>
        <Boundary key={view} onMap={() => go('map')}>
          <View />
        </Boundary>
      </main>
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
