// Arka plan müziği — WebAudio ile üretilen telifsiz lo-fi döngüsü.
// Dosya yok, telif yok: akorlar + bas + hi-hat gerçek zamanlı sentezlenir.
const KEY = 'tt-scroll-music';

// Am — F — C — G (lo-fi klasiği), MIDI notaları
const PROG = [
  { root: 45, chord: [57, 60, 64] },
  { root: 41, chord: [53, 57, 60] },
  { root: 48, chord: [55, 60, 64] },
  { root: 43, chord: [55, 59, 62] },
];
const BPM = 76;
const BAR = (60 / BPM) * 4;

let ctx = null, master = null, noiseBuf = null;
let playing = false, nextBar = 0, barIdx = 0, timer = null, ducked = false;

const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.05;
    master.connect(ctx.destination);
    // hi-hat için beyaz gürültü tamponu
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(midi, t, dur, type, vol) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq(midi);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function hat(t, vol) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  src.connect(hp).connect(g).connect(master);
  src.start(t);
}

function playBar(t) {
  const { root, chord } = PROG[barIdx % PROG.length];
  const beat = BAR / 4;
  // bas: her vuruşta yumuşak sinüs
  for (let b = 0; b < 4; b++) {
    tone(root - 12, t + b * beat, beat * 0.9, 'sine', b === 0 ? 1.0 : 0.55);
  }
  // akor: sekizliklerde tatlı arpej
  for (let e = 0; e < 8; e++) {
    const n = chord[e % chord.length] + (e === 7 ? 12 : 0);
    tone(n, t + e * (beat / 2), beat * 0.8, 'triangle', 0.32);
  }
  // hi-hat: sekizlikler, ikinci vuruşlar hafif
  for (let e = 0; e < 8; e++) hat(t + e * (beat / 2), e % 2 ? 0.1 : 0.2);
  barIdx++;
}

function scheduler() {
  while (nextBar < ctx.currentTime + 0.6) {
    playBar(nextBar);
    nextBar += BAR;
  }
}

export const music = {
  enabled() { return localStorage.getItem(KEY) !== '0'; },
  setEnabled(on) {
    localStorage.setItem(KEY, on ? '1' : '0');
    if (on) this.start(); else this.stop();
  },
  isPlaying() { return playing; },
  start() {
    if (playing || !this.enabled()) return;
    try {
      ensureCtx();
      playing = true;
      nextBar = ctx.currentTime + 0.1;
      scheduler();
      timer = setInterval(scheduler, 300);
    } catch { /* ses açılamadıysa sessiz devam */ }
  },
  stop() {
    playing = false;
    clearInterval(timer);
  },
  // oyun sırasında müziği kıs, bitince geri aç
  duck(on) {
    if (!ctx || ducked === on) return;
    ducked = on;
    master.gain.linearRampToValueAtTime(on ? 0.018 : 0.05, ctx.currentTime + 0.4);
  },
};
