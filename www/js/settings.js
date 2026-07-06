// Ayarlar ekranı: müzik, ses, titreşim, profil, rekor sıfırlama
import { music } from './music.js';
import { openProfileModal, getStats } from './profile.js';

export const APP_VERSION = '1.3';

function toggleRow(id, icon, label, checked) {
  return `
    <label class="set-row">
      <span class="set-label">${icon} ${label}</span>
      <input type="checkbox" class="set-toggle" data-set="${id}" ${checked ? 'checked' : ''}>
      <span class="switch"></span>
    </label>`;
}

export function openSettings({ onProfileChange } = {}) {
  const stats = getStats();
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-card">
      <h2>⚙️ Ayarlar</h2>
      <div class="stats-row">
        <div><b>${stats.games}</b><span>oyun</span></div>
        <div><b>${stats.score}</b><span>toplam skor</span></div>
      </div>
      ${toggleRow('music', '🎵', 'Müzik', music.enabled())}
      ${toggleRow('sfx', '🔊', 'Ses efektleri', localStorage.getItem('tt-scroll-muted') !== '1')}
      ${toggleRow('vibro', '📳', 'Titreşim', localStorage.getItem('tt-scroll-vibro') !== '0')}
      <button class="set-btn profile-edit">👤 Profili düzenle</button>
      <button class="set-btn danger reset-scores">🗑️ Rekorları sıfırla</button>
      <div class="set-version">TT Scroll v${APP_VERSION} · Umut yapımı 🎮</div>
      <button class="close-btn">Kapat</button>
    </div>`;

  modal.querySelectorAll('.set-toggle').forEach(t => {
    t.addEventListener('change', () => {
      const on = t.checked;
      if (t.dataset.set === 'music') {
        music.setEnabled(on);
        document.getElementById('music-btn').textContent = on ? '🎵' : '🔇';
      }
      if (t.dataset.set === 'sfx') localStorage.setItem('tt-scroll-muted', on ? '0' : '1');
      if (t.dataset.set === 'vibro') localStorage.setItem('tt-scroll-vibro', on ? '1' : '0');
    });
  });

  modal.querySelector('.profile-edit').addEventListener('click', () => {
    modal.remove();
    openProfileModal({ onSave: onProfileChange });
  });

  modal.querySelector('.reset-scores').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (btn.dataset.confirm) {
      Object.keys(localStorage)
        .filter(k => k.startsWith('tt-scroll-best-') || k === 'tt-scroll-stats')
        .forEach(k => localStorage.removeItem(k));
      btn.textContent = '✅ Rekorlar sıfırlandı';
      btn.disabled = true;
    } else {
      btn.dataset.confirm = '1';
      btn.textContent = '⚠️ Emin misin? Tekrar dokun';
    }
  });

  modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
  document.body.appendChild(modal);
}
