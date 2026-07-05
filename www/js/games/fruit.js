// Fruit Ninja tarzı: havaya fırlayan meyvelere dokun, bombaya dokunma!
const FRUITS = ['🍉', '🍎', '🍌', '🍊', '🍓', '🥝'];
const JUICE = { '🍉': '#ff5c7a', '🍎': '#e63946', '🍌': '#ffd93d', '🍊': '#ff9f1c', '🍓': '#ef476f', '🥝': '#80b918' };

export const fruit = {
  id: 'fruit',
  name: 'Meyve Patlat',
  emoji: '🍉',
  howTo: 'Meyvelere dokunarak patlat! 1 saniyede 3 meyve = KOMBO +2. Bombaya dokunma, 3 meyve kaçırma!',

  init(s) {
    s.G = {
      items: [],
      spawnTimer: 0.5,
      spawnEvery: 1.0,
      missed: 0,
      splats: [],
      juice: [],
      pops: [],      // kombo takibi için son patlatma zamanları
      spawnCount: 0,
      t: 0,
    };
  },

  tap(s, x, y) {
    const g = s.G;
    for (let i = g.items.length - 1; i >= 0; i--) {
      const it = g.items[i];
      if (Math.hypot(x - it.x, y - it.y) <= 52) {
        if (it.bomb) return s.end();
        g.items.splice(i, 1);
        s.addScore();
        g.spawnEvery = Math.max(0.45, g.spawnEvery * 0.97);
        g.splats.push({ x: it.x, y: it.y, emoji: '💥', text: null, life: 0.35 });
        // meyve suyu parçacıkları
        const color = JUICE[it.emoji] || '#ff5c7a';
        for (let k = 0; k < 9; k++) {
          g.juice.push({
            x: it.x, y: it.y,
            vx: (Math.random() - 0.5) * 420, vy: -Math.random() * 320,
            color, r: 3 + Math.random() * 5, life: 0.6,
          });
        }
        // kombo: 1 saniye içinde 3 patlatma
        g.pops.push(g.t);
        g.pops = g.pops.filter(p => g.t - p < 1);
        if (g.pops.length >= 3) {
          g.pops = [];
          s.addScore(2);
          g.splats.push({ x: it.x, y: it.y - 60, emoji: null, text: 'KOMBO! 🔥', life: 0.8 });
        }
        return;
      }
    }
  },

  launch(s, extraVx = 0) {
    const g = s.G;
    const fromLeft = Math.random() < 0.5;
    g.items.push({
      x: fromLeft ? s.w * 0.15 + Math.random() * s.w * 0.2 : s.w * 0.65 + Math.random() * s.w * 0.2,
      y: s.h + 40,
      vx: (fromLeft ? 1 : -1) * (40 + Math.random() * 90) + extraVx,
      vy: -(s.h * 1.15 + Math.random() * s.h * 0.25),
      bomb: Math.random() < 0.16,
      emoji: FRUITS[Math.floor(Math.random() * FRUITS.length)],
      spin: Math.random() * 4 - 2,
      rot: 0,
    });
  },

  update(s, dt) {
    const g = s.G;
    g.t += dt;
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      g.spawnTimer = g.spawnEvery;
      g.spawnCount++;
      // her 4. atış: 3-4 meyvelik yaylım!
      if (g.spawnCount % 4 === 0) {
        const n = 3 + Math.floor(Math.random() * 2);
        for (let k = 0; k < n; k++) this.launch(s, (k - n / 2) * 40);
        g.spawnTimer = g.spawnEvery * 1.6;
      } else {
        this.launch(s);
      }
    }

    for (const j of g.juice) {
      j.vy += 1000 * dt;
      j.x += j.vx * dt;
      j.y += j.vy * dt;
      j.life -= dt;
    }
    g.juice = g.juice.filter(j => j.life > 0);

    for (let i = g.items.length - 1; i >= 0; i--) {
      const it = g.items[i];
      it.vy += s.h * 0.75 * dt; // yerçekimi ekran boyuna ölçekli
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      it.rot += it.spin * dt;
      if (it.y > s.h + 60 && it.vy > 0) {
        g.items.splice(i, 1);
        if (!it.bomb) {
          g.missed++;
          if (g.missed >= 3) return s.end();
        }
      }
    }

    for (const sp of g.splats) sp.life -= dt;
    g.splats = g.splats.filter(sp => sp.life > 0);
  },

  draw(s, ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#1e1233');
    bg.addColorStop(1, '#3a1c2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const it of s.G.items) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      ctx.font = '56px serif';
      ctx.fillText(it.bomb ? '💣' : it.emoji, 0, 0);
      ctx.restore();
    }

    // meyve suyu sıçramaları
    for (const j of s.G.juice) {
      ctx.globalAlpha = Math.max(0, j.life / 0.6);
      ctx.fillStyle = j.color;
      ctx.beginPath();
      ctx.arc(j.x, j.y, j.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const sp of s.G.splats) {
      if (sp.text) {
        ctx.globalAlpha = Math.min(1, sp.life / 0.4);
        ctx.font = '900 30px sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(sp.text, sp.x, sp.y);
      } else {
        ctx.globalAlpha = sp.life / 0.35;
        ctx.font = '44px serif';
        ctx.fillText(sp.emoji, sp.x, sp.y);
      }
    }
    ctx.globalAlpha = 1;

    // kaçırma hakları
    ctx.font = '20px serif';
    let hearts = '';
    for (let i = 0; i < 3; i++) hearts += i < 3 - s.G.missed ? '🍏' : '🥀';
    ctx.fillText(hearts, s.w / 2, s.h * 0.09);
  },
};
