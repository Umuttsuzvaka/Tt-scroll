// GameShell: her mini oyunun ortak altyapısı.
// Oyun mantığı sadece { init, tap, update, draw } uygular;
// döngü, durum (hazır/oynuyor/bitti), skor ve rekor buradan yönetilir.
export class GameShell {
  constructor(canvas, hud, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;
    this.game = game;
    this.state = 'ready'; // ready | playing | over
    this.score = 0;
    this.raf = null;
    this.lastTime = 0;
    this.destroyed = false;

    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);

    this.onTap = (e) => {
      const rect = canvas.getBoundingClientRect();
      const p = e.changedTouches ? e.changedTouches[0] : e;
      this.handleTap(p.clientX - rect.left, p.clientY - rect.top);
    };
    // click hem mouse hem mobil dokunma için yeterli; kaydırma jestleri tetiklemez
    canvas.addEventListener('click', this.onTap);
    hud.overlay.addEventListener('click', this.onTap);

    this.showReady();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  bestKey() { return 'tt-scroll-best-' + this.game.id; }
  getBest() { return Number(localStorage.getItem(this.bestKey()) || 0); }

  setScore(n) {
    this.score = n;
    this.hud.scoreEl.textContent = n;
  }
  addScore(n = 1) { this.setScore(this.score + n); }

  showReady() {
    this.state = 'ready';
    this.setScore(0);
    this.hud.bestEl.textContent = 'Rekor: ' + this.getBest();
    this.hud.showOverlay({
      emoji: this.game.emoji,
      title: this.game.name,
      text: this.game.howTo,
      button: 'Başlamak için dokun',
    });
    this.game.init(this);
    this.drawFrame(); // arka planda oyunun ilk karesi görünsün
  }

  start() {
    this.hud.hideOverlay();
    this.setScore(0);
    this.game.init(this);
    this.state = 'playing';
    this.lastTime = performance.now();
    this.loop();
  }

  end() {
    if (this.state !== 'playing') return;
    this.state = 'over';
    cancelAnimationFrame(this.raf);
    const best = this.getBest();
    const isRecord = this.score > best;
    if (isRecord) localStorage.setItem(this.bestKey(), String(this.score));
    this.hud.showOverlay({
      emoji: '💀',
      title: 'Oyun Bitti!',
      finalScore: this.score,
      record: isRecord,
      button: 'Tekrar oyna',
    });
  }

  handleTap(x, y) {
    if (this.destroyed) return;
    if (this.state === 'ready' || this.state === 'over') {
      this.start();
    } else if (this.state === 'playing') {
      this.game.tap(this, x, y);
    }
  }

  loop() {
    if (this.destroyed || this.state !== 'playing') return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.game.update(this, dt);
    if (this.state === 'playing') this.drawFrame();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  drawFrame() {
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.game.draw(this, this.ctx);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.canvas.removeEventListener('click', this.onTap);
    this.hud.overlay.removeEventListener('click', this.onTap);
  }
}
