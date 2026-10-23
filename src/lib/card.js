// Draws the shareable hero card onto a canvas and returns it. d: { name, title, rank, xp, wins, badges, badgeTotal, streak, color, next, pct }
export function drawCard(canvas, d) {
  const W = 1200, H = 630
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext('2d')
  const g = c.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#0d1418')
  g.addColorStop(1, '#1b2a33')
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
  c.strokeStyle = '#e8a33d'
  c.lineWidth = 6
  c.strokeRect(24, 24, W - 48, H - 48)
  c.fillStyle = d.color || '#e8a33d'
  c.beginPath()
  c.arc(150, 190, 80, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#0d1418'
  c.font = 'bold 90px sans-serif'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText((d.name || '?').trim().charAt(0).toUpperCase(), 150, 194)
  c.textAlign = 'left'
  c.textBaseline = 'alphabetic'
  c.fillStyle = '#f2ede2'
  c.font = 'bold 64px sans-serif'
  c.fillText(d.name, 270, 175)
  c.fillStyle = '#e8a33d'
  c.font = '30px monospace'
  c.fillText(`${d.title || 'Adventurer'} · ${d.rank}`, 270, 225)
  const stats = [['XP', d.xp], ['Wins', d.wins], ['Streak', d.streak], ['Badges', `${d.badges}/${d.badgeTotal}`]]
  stats.forEach(([k, v], i) => {
    const x = 70 + i * 275
    c.fillStyle = '#16232b'
    c.fillRect(x, 320, 250, 130)
    c.fillStyle = '#f2ede2'
    c.font = 'bold 54px sans-serif'
    c.fillText(String(v), x + 20, 395)
    c.fillStyle = '#8aa0ab'
    c.font = '24px monospace'
    c.fillText(k, x + 20, 432)
  })
  c.fillStyle = '#16232b'
  c.fillRect(70, 490, 1060, 22)
  c.fillStyle = '#e8a33d'
  c.fillRect(70, 490, 1060 * Math.min(1, Math.max(0, d.pct / 100)), 22)
  c.fillStyle = '#8aa0ab'
  c.font = '24px monospace'
  c.fillText(d.next || 'Max rank reached', 70, 545)
  c.textAlign = 'right'
  c.fillStyle = '#e8a33d'
  c.font = 'bold 30px sans-serif'
  c.fillText('Dungeon of Data', W - 70, 585)
  return canvas
}
