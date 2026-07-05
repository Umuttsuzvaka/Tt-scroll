const COLORS = [
  { name: 'KIRMIZI', hex: '#fe2c55' },
  { name: 'YEŞİL', hex: '#2de2a3' },
  { name: 'MAVİ', hex: '#3d9bff' },
  { name: 'SARI', hex: '#ffd700' },
];

export const colortap = {
  id: 'colortap',
  name: 'Renk Yakala',
  emoji: '🌈',
  howTo: 'Daire istenen renk olduğunda dokun. Yanlış renkte dokunursan kaybedersin!',

  init(s) {
    s.G = {
      target: COLORS[Math.floor(Math.random() * COLORS.length)],
      current: 0,
      interval: 0.85,
      timer: 0,
      matchDeadline: 0, // eşleşme yakalanmazsa süre dolunca oyun biter
    };
  },

  tap(s) {
    const g = s.G;
    if (COLORS[g.current].name === g.target.name) {
      s.addScore();
      g.interval = Math.max(0.35, g.interval * 0.95);
      g.target = COLORS[Math.floor(Math.random() * COLORS.length)];
      g.timer = 0;
      g.current = Math.floor(Math.random() * COLORS.length);
      g.matchDeadline = 0;
    } else {
      s.end();
    }
  },

  update(s, dt) {
    const g = s.G;
    g.timer += dt;
    if (g.matchDeadline > 0) {
      g.matchDeadline -= dt;
      if (g.matchDeadline <= 0) return s.end(); // eşleşmeyi kaçırdı
    }
    if (g.timer >= g.interval) {
      g.timer = 0;
      g.current = (g.current + 1 + Math.floor(Math.random() * (COLORS.length - 1))) % COLORS.length;
      if (COLORS[g.current].name === g.target.name) {
        g.matchDeadline = g.interval * 0.98;
      } else {
        g.matchDeadline = 0;
      }
    }
  },

  draw(s, ctx) {
    const g = s.G;
    ctx.fillStyle = '#12121f';
    ctx.fillRect(0, 0, s.w, s.h);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px sans-serif';
    ctx.fillText('İSTENEN RENK', s.w / 2, s.h * 0.26);
    ctx.font = '900 42px sans-serif';
    ctx.fillStyle = g.target.hex;
    ctx.fillText(g.target.name, s.w / 2, s.h * 0.33);

    const r = Math.min(s.w, s.h) * 0.18;
    ctx.beginPath();
    ctx.arc(s.w / 2, s.h * 0.58, r, 0, Math.PI * 2);
    ctx.fillStyle = COLORS[g.current].hex;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.stroke();
  },
};
