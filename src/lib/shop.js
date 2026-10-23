// The XP shop. Gold is earned 1:1 with XP but spending it never lowers your rank (rank follows total XP).
export const SHOP = [
  { id: 'freeze', kind: 'freeze', name: 'Streak freeze', cost: 60, desc: 'Saves your daily streak if you miss one day. Hold up to 2.' },
  { id: 'frame-gold', kind: 'frame', name: 'Gold ring', cost: 120, desc: 'A gold frame around your avatar.', css: 'gold' },
  { id: 'frame-arc', kind: 'frame', name: 'Arc ring', cost: 150, desc: 'A glowing blue frame.', css: 'arc' },
  { id: 'frame-flame', kind: 'frame', name: 'Flame ring', cost: 250, desc: 'A pulsing torch-fire frame.', css: 'flame' },
  { id: 'frame-prism', kind: 'frame', name: 'Prismatic ring', cost: 400, desc: 'A colour-cycling frame.', css: 'prism' },
  { id: 'title-slayer', kind: 'title', name: 'Goblin Slayer', cost: 80, desc: 'A title for your hero card.' },
  { id: 'title-survivor', kind: 'title', name: 'Stack Overflow Survivor', cost: 100, desc: 'A title for your hero card.' },
  { id: 'title-legend', kind: 'title', name: 'O(1) Legend', cost: 200, desc: 'A title for your hero card.' },
]
export const MAX_FREEZES = 2
export const shopItem = (id) => SHOP.find((s) => s.id === id)
