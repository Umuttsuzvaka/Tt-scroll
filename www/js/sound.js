// WebAudio ile küçük ses efektleri — ses dosyası gerekmez
let ctx;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function muted() {
  return localStorage.getItem('tt-scroll-muted') === '1';
}

function tone(freq, dur, delay = 0, type = 'square', vol = 0.1) {
  if (muted()) return;
  try {
    const c = ac();
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur);
  } catch { /* ses açılamazsa oyun sessiz devam eder */ }
}

export const sound = {
  // ilk kullanıcı dokunuşunda AudioContext'i aç (mobil tarayıcı kuralı)
  unlock() { try { if (!muted()) ac(); } catch { } },
  tap() { tone(240, 0.05, 0, 'sine', 0.05); },
  score() { tone(660, 0.07); tone(880, 0.09, 0.06); },
  over() {
    tone(300, 0.15, 0, 'sawtooth', 0.08);
    tone(200, 0.2, 0.12, 'sawtooth', 0.08);
    tone(120, 0.3, 0.26, 'sawtooth', 0.08);
  },
  record() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, i * 0.09, 'triangle', 0.13)); },
  // piyano notası: MIDI numarasından frekansa (A4 = 69 = 440 Hz)
  pianoNote(midi) {
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    tone(f, 0.55, 0, 'triangle', 0.2);       // ana ton
    tone(f * 2, 0.35, 0, 'sine', 0.07);      // oktav harmoniği (parlaklık)
    tone(f / 2, 0.4, 0, 'sine', 0.05);       // bas desteği (sıcaklık)
  },
};

export function vibrate(ms) {
  if (localStorage.getItem('tt-scroll-vibro') === '0') return;
  try { navigator.vibrate?.(ms); } catch { }
}
