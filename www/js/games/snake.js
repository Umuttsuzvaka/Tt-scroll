// Klasik Yılan — kaydırarak yön değiştir
export const snake = {
  id: 'snake',
  name: 'Yılan',
  emoji: '🐍',
  howTo: 'Kaydırarak yılanı yönlendir! Elmaları ye, duvara ve kendine çarpma.',
  quietTaps: true,

  init(s) {
    const cols = 15;
    const cell = Math.floor(s.w / cols);
    const rows = Math.floor((s.h * 0.78) / cell);
    s.G = {
      cols, rows, cell,
      oy: s.h * 0.14,
      body: [[7, Math.floor(rows / 2)], [6, Math.floor(rows / 2)], [5, Math.floor(rows / 2)]],
      dir: [1, 0], nextDir: [1, 0],
      food: null,
      stepTimer: 0,
      t: 0,
    };
    this.placeFood(s);
  },

  placeFood(s) {
    const g = s.G;
    do {
      g.food = [Math.floor(Math.random() * g.cols), Math.floor(Math.random() * g.rows)];
    } while (g.body.some(([x, y]) => x === g.food[0] && y === g.food[1]));
  },

  tap() { },

  gesture(s, dir) {
    const g = s.G;
    const map = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
    const nd = map[dir];
    // geri dönüş yasak
    if (nd[0] === -g.dir[0] && nd[1] === -g.dir[1]) return;
    g.nextDir = nd;
  },

  update(s, dt) {
    const g = s.G;
    g.t += dt;
    g.stepTimer += dt;
    const step = Math.max(0.08, 0.17 - g.body.length * 0.003);
    if (g.stepTimer < step) return;
    g.stepTimer = 0;

    g.dir = g.nextDir;
    const head = [g.body[0][0] + g.dir[0], g.body[0][1] + g.dir[1]];
    if (head[0] < 0 || head[0] >= g.cols || head[1] < 0 || head[1] >= g.rows) return s.end();
    if (g.body.some(([x, y]) => x === head[0] && y === head[1])) return s.end();
    g.body.unshift(head);
    if (head[0] === g.food[0] && head[1] === g.food[1]) {
      s.addScore();
      this.placeFood(s);
    } else {
      g.body.pop();
    }
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#0e2018');
    bg.addColorStop(1, '#081410');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    const px = (c) => c * g.cell + (s.w - g.cols * g.cell) / 2;
    const py = (r) => g.oy + r * g.cell;

    // saha çerçevesi + satranç deseni
    ctx.fillStyle = 'rgba(255,255,255,.025)';
    for (let r = 0; r < g.rows; r++) {
      for (let c = (r % 2); c < g.cols; c += 2) {
        ctx.fillRect(px(c), py(r), g.cell, g.cell);
      }
    }
    ctx.strokeStyle = 'rgba(120,255,180,.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px(0) - 2, py(0) - 2, g.cols * g.cell + 4, g.rows * g.cell + 4);

    // elma: nabız gibi atan
    const fr = g.cell * (0.36 + Math.sin(g.t * 6) * 0.04);
    const fx = px(g.food[0]) + g.cell / 2, fy = py(g.food[1]) + g.cell / 2;
    ctx.shadowColor = '#fe2c55';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#fe2c55';
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(fx - 1.5, fy - fr - 5, 3, 6);

    // yılan gövdesi: baştan kuyruğa incelen ve renk değiştiren
    for (let i = g.body.length - 1; i >= 0; i--) {
      const [c, r] = g.body[i];
      const frac = 1 - i / g.body.length;
      const inset = g.cell * (0.06 + (1 - frac) * 0.12);
      ctx.fillStyle = `hsl(${140 + frac * 25} 70% ${35 + frac * 20}%)`;
      ctx.beginPath();
      ctx.roundRect(px(c) + inset, py(r) + inset, g.cell - inset * 2, g.cell - inset * 2, g.cell * 0.3);
      ctx.fill();
    }
    // gözler
    const [hc, hr] = g.body[0];
    const hx = px(hc) + g.cell / 2, hy = py(hr) + g.cell / 2;
    ctx.fillStyle = '#fff';
    const ex = g.dir[0] * 3, ey = g.dir[1] * 3;
    for (const side of [-1, 1]) {
      const ox2 = g.dir[1] !== 0 ? side * 4 : 0;
      const oy2 = g.dir[0] !== 0 ? side * 4 : 0;
      ctx.beginPath();
      ctx.arc(hx + ex + ox2, hy + ey + oy2, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};
