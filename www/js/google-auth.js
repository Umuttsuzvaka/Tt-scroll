// Google ile giriş — Google Identity Services (GIS)
// Çalışması için config.js içine OAuth istemci kimliği yazılmalı (bkz. README).
import { GOOGLE_CLIENT_ID } from './config.js';

export function googleConfigured() {
  return Boolean(GOOGLE_CLIENT_ID);
}

let gisLoaded = null;
function loadGis() {
  if (gisLoaded) return gisLoaded;
  gisLoaded = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = 'https://accounts.google.com/gsi/client';
    el.onload = resolve;
    el.onerror = () => reject(new Error('gsi-load-failed'));
    document.head.appendChild(el);
  });
  return gisLoaded;
}

export async function signInWithGoogle() {
  if (!googleConfigured()) throw new Error('not-configured');
  await loadGis();
  return new Promise((resolve, reject) => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => {
        try {
          const b64 = resp.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(decodeURIComponent(escape(atob(b64))));
          resolve({
            name: payload.given_name || payload.name || 'Oyuncu',
            photo: payload.picture || null,
            email: payload.email || null,
          });
        } catch (e) { reject(e); }
      },
    });
    window.google.accounts.id.prompt((notif) => {
      if (notif.isNotDisplayed?.() || notif.isSkippedMoment?.()) {
        reject(new Error('dismissed'));
      }
    });
  });
}
