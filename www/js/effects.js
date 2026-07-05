// DOM tabanlı görsel efektler: skor pop-up, konfeti, uçan kalpler

export function floatText(parent, text, x, y) {
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  parent.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

export function confettiBurst(parent) {
  const colors = ['#fe2c55', '#2de2a3', '#3d9bff', '#ffd700', '#8a2be2', '#ff8c00'];
  for (let i = 0; i < 36; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.background = colors[i % colors.length];
    el.style.left = 30 + Math.random() * 40 + '%';
    el.style.setProperty('--dx', (Math.random() * 2 - 1) * 180 + 'px');
    el.style.setProperty('--dy', -(140 + Math.random() * 280) + 'px');
    el.style.setProperty('--rot', Math.random() * 720 - 360 + 'deg');
    parent.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}

export function heartBurst(parent, n = 6) {
  const emojis = ['❤️', '🧡', '💜', '💙', '💛'];
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'float-heart';
    el.textContent = emojis[i % emojis.length];
    el.style.right = 10 + Math.random() * 46 + 'px';
    el.style.bottom = 140 + Math.random() * 50 + 'px';
    el.style.animationDelay = i * 0.08 + 's';
    parent.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
}
