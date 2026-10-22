import { useProgress } from './progress'
import { useSettings } from './settings'
import { sfx } from './lib/sfx'

const Seg = ({ value, options, onChange, label }) => (
  <div className="chips" role="radiogroup" aria-label={label}>
    {options.map(([k, l]) => (
      <button key={k} role="radio" aria-checked={value === k} className={`opt ${value === k ? 'on' : ''}`} onClick={() => onChange(k)}>{l}</button>
    ))}
  </div>
)

export default function SettingsView() {
  const { go } = useProgress()
  const st = useSettings()
  return (
    <>
      <div className="roomhead">
        <div>
          <h2>Settings</h2>
          <p className="lede">Preferences for this device. They apply to every profile.</p>
        </div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      <div className="card formcard">
        <h3>Appearance</h3>
        <div className="field">Theme<Seg label="Theme" value={st.theme} onChange={(theme) => st.set({ theme })} options={[['dark', 'Dark'], ['light', 'Light'], ['system', 'Match system']]} /></div>
        <div className="field">Text size<Seg label="Text size" value={st.text} onChange={(text) => st.set({ text })} options={[['normal', 'Normal'], ['large', 'Large']]} /></div>
      </div>
      <div className="card formcard">
        <h3>Sound</h3>
        <div className="field">Sound effects<Seg label="Sound effects" value={st.sound ? 'on' : 'off'} onChange={(v) => { st.set({ sound: v === 'on' }); if (v === 'on') setTimeout(() => sfx('win'), 50) }} options={[['on', 'On'], ['off', 'Off']]} /></div>
        <label className="field">Volume {Math.round(st.volume * 100)}%
          <input type="range" min="0.05" max="1" step="0.05" value={st.volume} disabled={!st.sound} onChange={(e) => st.set({ volume: Number(e.target.value) })} onPointerUp={() => sfx('hit')} aria-label="Volume" />
        </label>
        <p className="fine">Sounds are generated in the browser, so there is nothing to download. Hits, misses, wins, losses and unlocked achievements each have their own tone.</p>
      </div>
      <div className="card formcard">
        <h3>Hints</h3>
        <p className="fine">Rooms with a Hint button explain the next step. Using a hint in a round caps that round at 2 stars, so the stars still mean you worked it out yourself.</p>
      </div>
      <div className="card formcard">
        <h3>Privacy</h3>
        <p className="fine">Your progress is stored in this browser only. If you choose to sign in and link a profile, the save is stored in the project's database where only you can read it, and your name, colour and scores go on the public leaderboard unless you hide them in Account. You can delete all cloud data there at any time. If analytics is enabled on this copy it uses GoatCounter: no cookies, no personal data, and it respects Do Not Track.</p>
      </div>
    </>
  )
}
