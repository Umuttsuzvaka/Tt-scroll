// Fruit Ninja tarzı: havaya fırlayan meyvelere dokun, bombaya dokunma!
const FRUITS = ['🍉', '🍎', '🍌', '🍊', '🍓', '🥝'];

export const fruit = {
  id: 'fruit',
  name: 'Meyve Patlat',
  emoji: '🍉',
  howTo: 'Meyvelere dokunarak patlat! Bombaya dokunma, 3 meyve kaçırırsan oyun biter.',

  init(s) {
    s.G = {
      items: [],
      spawnTimer: 0.5,
      spawnEvery: 1.0,
      missed: 0,
      splats: [],
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
        g.splats.push({ x: it.x, y: it.y, emoji: '💥', life: 0.35 });
        return;
      }
    }
  },

  update(s, dt) {
    const g = s.G;
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      g.spawnTimer = g.spawnEvery;
      const fromLeft = Math.random() < 0.5;
      g.items.push({
        x: fromLeft ? s.w * 0.15 + Math.random() * s.w * 0.2 : s.w * 0.65 + Math.random() * s.w * 0.2,
        y: s.h + 40,
        vx: (fromLeft ? 1 : -1) * (40 + Math.random() * 90),
        vy: -(s.h * 1.15 + Math.random() * s.h * 0.25),
        bomb: Math.random() < 0.16,
        emoji: FRUITS[Math.floor(Math.random() * FRUITS.length)],
        spin: Math.random() * 4 - 2,
        rot: 0,
      });
    }

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

    ctx.font = '44px serif';
    for (const sp of s.G.splats) {
      ctx.globalAlpha = sp.life / 0.35;
      ctx.fillText(sp.emoji, sp.x, sp.y);
    }
    ctx.globalAlpha = 1;

    // kaçırma hakları
    ctx.font = '20px serif';
    let hearts = '';
    for (let i = 0; i < 3; i++) hearts += i < 3 - s.G.missed ? '🍏' : '🥀';
    ctx.fillText(hearts, s.w / 2, s.h * 0.09);
  },
};
