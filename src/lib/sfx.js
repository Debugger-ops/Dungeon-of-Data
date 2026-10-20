// Tiny WebAudio synth: no audio files. Browsers only allow sound after a user gesture, which every game action is.
let enabled = true
let volume = 0.35
let ctx = null
export const setSfx = (on, vol = 0.35) => {
  enabled = !!on
  volume = vol
}

function audio() {
  try {
    if (!ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch (e) {
    return null
  }
}

// notes: [frequency Hz, start offset s, duration s]
function tones(notes, type = 'square', gain = 0.12) {
  if (!enabled) return
  const a = audio()
  if (!a) return
  const t0 = a.currentTime
  notes.forEach(([f, at, d]) => {
    const o = a.createOscillator()
    const g = a.createGain()
    o.type = type
    o.frequency.value = f
    g.gain.setValueAtTime(0.0001, t0 + at)
    g.gain.exponentialRampToValueAtTime(gain * volume * 2.5, t0 + at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + d)
    o.connect(g).connect(a.destination)
    o.start(t0 + at)
    o.stop(t0 + at + d + 0.02)
  })
}

const SOUNDS = {
  hit: () => tones([[660, 0, 0.07], [990, 0.06, 0.1]]),
  miss: () => tones([[180, 0, 0.16], [140, 0.08, 0.2]], 'sawtooth', 0.1),
  win: () => tones([[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.3]], 'triangle', 0.16),
  lose: () => tones([[392, 0, 0.2], [330, 0.2, 0.2], [262, 0.4, 0.35]], 'sawtooth', 0.1),
  badge: () => tones([[880, 0, 0.1], [1175, 0.1, 0.1], [1568, 0.2, 0.25]], 'sine', 0.16),
  tap: () => tones([[440, 0, 0.04]], 'sine', 0.08),
}
export const sfx = (name) => {
  try {
    if (SOUNDS[name]) SOUNDS[name]()
  } catch (e) {
    /* sound is optional */
  }
}
