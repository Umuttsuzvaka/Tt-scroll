// Hafıza Sırası (Simon tarzı) — yanan sırayı ezberle ve tekrarla!
import { sound } from '../sound.js';

const PADS = [
  { color: '#2de2a3', dark: '#14805c', note: 64 },
  { color: '#fe2c55', dark: '#8f1a32', note: 60 },
  { color: '#ffd23f', dark: '#8f7413', note: 67 },
  { color: '#3d9bff', dark: '#1e4f85', note: 72 },
];

export const simon = {
  id: 'simon',
  name: 'Hafıza Sırası',
  emoji: '🧠',
  howTo: 'Yanan renk sırasını ezberle, sonra aynı sırayla dokun! Her turda dizi 1 uzar.',
  quietTaps: true,

  init(s) {
    s.G = {
      seq: [Math.floor(Math.random() * 4)],
      phase: 'show', // show | input
      showIdx: 0,
      inputIdx: 0,
      lit: -1,
      timer: 0.8,
      pressTimer: 0,
      goFlash: 0, // 'TEKRARLA' vurgusu: giriş fazına geçişte başlık parlar
    };
  },

  padRect(s, i) {
    const size = Math.min(s.w - 48, s.h * 0.5);
    const half = size / 2 - 6;
    const ox = (s.w - size) / 2, oy = s.h * 0.26;
    return {
      x: ox + (i % 2) * (half + 12),
      y: oy + Math.floor(i / 2) * (half + 12),
      w: half, h: half,
    };
  },

  press(s, i) {
    const g = s.G;
    g.lit = i;
    g.pressTimer = 0.25;
    sound.pianoNote(PADS[i].note);
  },

  tap(s, x, y) {
    const g = s.G;
    if (g.phase !== 'input') return;
    for (let i = 0; i < 4; i++) {
      const r = this.padRect(s, i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        this.press(s, i);
        if (i !== g.seq[g.inputIdx]) return s.end();
        g.inputIdx++;
        if (g.inputIdx >= g.seq.length) {
          s.setScore(g.seq.length);
          g.seq.push(Math.floor(Math.random() * 4));
          g.phase = 'show';
          g.showIdx = 0;
          g.timer = 0.9;
        }
        return;
      }
    }
  },

  update(s, dt) {
    const g = s.G;
    g.pressTimer = Math.max(0, g.pressTimer - dt);
    g.goFlash = Math.max(0, g.goFlash - dt);
    if (g.pressTimer === 0 && g.phase !== 'show') g.lit = -1;

    if (g.phase === 'show') {
      g.timer -= dt;
      if (g.timer <= 0) {
        if (g.showIdx < g.seq.length) {
          this.press(s, g.seq[g.showIdx]);
          g.showIdx++;
          g.timer = Math.max(0.32, 0.6 - g.seq.length * 0.02);
        } else {
          g.lit = -1;
          g.phase = 'input';
          g.inputIdx = 0;
          g.goFlash = 0.7; // sıra sende! net görsel vurgu
        }
      }
      if (g.pressTimer === 0) g.lit = -1;
    }
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createRadialGradient(s.w / 2, s.h * 0.45, 40, s.w / 2, s.h / 2, s.h * 0.7);
    bg.addColorStop(0, '#1c1c30');
    bg.addColorStop(1, '#0b0b14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    ctx.textAlign = 'center';
    if (g.phase === 'show') {
      // gösterim: sarı başlık — dokunuşlar bu fazda sayılmaz
      ctx.fillStyle = '#ffd23f';
      ctx.font = '800 20px sans-serif';
      ctx.fillText('👀 İZLE...', s.w / 2, s.h * 0.18);
    } else {
      // giriş fazına geçişte yeşil parlama + hafif büyüme: "sıra sende!"
      const f = g.goFlash;
      ctx.fillStyle = f > 0 ? '#2de2a3' : 'rgba(255,255,255,.85)';
      ctx.font = `800 ${Math.round(20 + f * 8)}px sans-serif`;
      ctx.fillText('👆 SIRAYI TEKRARLA!', s.w / 2, s.h * 0.18);
    }
    ctx.font = '600 14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fillText(`Dizi uzunluğu: ${g.seq.length}`, s.w / 2, s.h * 0.215);

    for (let i = 0; i < 4; i++) {
      const r = this.padRect(s, i);
      const on = g.lit === i;
      if (on) {
        ctx.shadowColor = PADS[i].color;
        ctx.shadowBlur = 34;
      }
      const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      grad.addColorStop(0, on ? '#ffffff' : PADS[i].color);
      grad.addColorStop(0.12, on ? PADS[i].color : PADS[i].color);
      grad.addColorStop(1, on ? PADS[i].color : PADS[i].dark);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 20);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (!on) {
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        ctx.beginPath();
        ctx.roundRect(r.x, r.y + r.h * 0.55, r.w, r.h * 0.45, 20);
        ctx.fill();
      }
    }

    // giriş ilerlemesi noktaları
    if (g.phase === 'input') {
      const n = g.seq.length;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i < g.inputIdx ? '#2de2a3' : 'rgba(255,255,255,.25)';
        const spacing = Math.min(20, (s.w - 60) / n);
        ctx.beginPath();
        ctx.arc(s.w / 2 + (i - (n - 1) / 2) * spacing, s.h * 0.82, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
};
