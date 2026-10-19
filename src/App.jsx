import { useEffect } from 'react'
import { useProgress } from './progress'
import { AccountProvider, Avatar, useAccount } from './accounts'
import AccountView from './AccountView'
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
import Daily from './Daily'
import Quiz from './Quiz'
import Analytics from './Analytics'

const VIEWS = { map: MapView, sort: SortingHall, bsearch: BinaryVault, keep: TheKeep, crypt: RootCrypt, maze: GraphLabyrinth, hash: HashForge, daily: Daily, quiz: Quiz, lab: Analytics, account: AccountView, tome: Tome, ledger: Ledger }
const NAV = [['map', 'Map'], ['sort', 'Sorting Hall'], ['bsearch', 'Binary Vault'], ['keep', 'The Keep'], ['crypt', 'Root Crypt'], ['maze', 'Labyrinth'], ['hash', 'Hash Forge'], ['daily', 'Daily'], ['quiz', 'Quiz'], ['lab', 'Analytics'], ['tome', 'Tome'], ['ledger', 'Ledger']]

function Shell() {
  const { S, view, go } = useProgress()
  const { profile } = useAccount()
  const View = VIEWS[view]
  useEffect(() => {
    window.scrollTo(0, 0)
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
      <div className="top">
        <div className="brand">
          <h1>Dungeon of Data</h1>
          <small>Defend the keep by thinking like an algorithm</small>
        </div>
        <button className={`who ${view === 'account' ? 'on' : ''}`} onClick={() => go('account')} aria-label={`Account: ${profile.name}`}>
          <Avatar p={profile} size={28} />
          <span>{profile.name}</span>
        </button>
        <div className="rank">
          <div className="rt"><b>{cur[1]}</b><span>{nx ? `${S.xp} / ${nx[0]} XP` : `${S.xp} XP · max rank`}</span></div>
          <div className="meter"><i style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
      <nav className="nav" aria-label="Rooms">
        {NAV.map(([k, label]) => (
          <button key={k} className={k === view ? 'on' : ''} onClick={() => go(k)}>{label}</button>
        ))}
      </nav>
      <main className="main">
        <View key={view} />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AccountProvider>
      <Shell />
    </AccountProvider>
  )
}
