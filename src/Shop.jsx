import { SHOP, MAX_FREEZES } from './lib/shop'
import { useProgress } from './progress'
import { Avatar, useAccount } from './accounts'

// Spend gold (earned 1:1 with XP) on cosmetics and streak freezes. Spending never lowers rank.
export default function Shop() {
  const { S, go, buy, setFrame } = useProgress()
  const { profile } = useAccount()
  return (
    <>
      <div className="roomhead">
        <div><h2>XP Shop</h2><p className="lede">Every XP you earn also becomes a gold coin. Spend gold on streak freezes, avatar rings and hero-card titles. Your rank follows total XP, so spending never sets you back.</p></div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      <div className="card">
        <div className="statrow" style={{ margin: 0 }}><span>Gold <b data-testid="gold">{S.gold}</b></span><span>Streak freezes <b data-testid="freezes">{S.freezes}/{MAX_FREEZES}</b></span></div>
      </div>
      <div className="shopgrid">
        {SHOP.map((it) => {
          const owned = it.kind !== 'freeze' && S.owned.includes(it.id)
          const full = it.kind === 'freeze' && S.freezes >= MAX_FREEZES
          const cant = S.gold < it.cost
          return (
            <div key={it.id} className="card shopitem">
              {it.kind === 'frame' && <div className={`frame ${it.css}`}><Avatar p={profile} size={44} /></div>}
              <h3>{it.name}</h3>
              <p className="fine">{it.desc}</p>
              <div className="row">
                {owned ? (
                  it.kind === 'frame' ? <button className="btn" disabled={S.frame === it.css} onClick={() => setFrame(it.css)}>{S.frame === it.css ? 'Equipped' : 'Equip'}</button> : <span className="fine" style={{ margin: 0 }}>Owned. Pick it on your hero card.</span>
                ) : (
                  <button className="btn primary" disabled={cant || full} onClick={() => buy(it.id)} aria-label={`Buy ${it.name} for ${it.cost} gold`}>{full ? 'Max held' : cant ? `Need ${it.cost - S.gold} more` : `Buy · ${it.cost} gold`}</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {S.frame && <div className="row"><button className="btn" onClick={() => setFrame('')}>Remove my ring</button></div>}
    </>
  )
}
