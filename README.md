# 🎮 TT Scroll — Kaydır, Oyna!

TikTok tarzı dikey kaydırmalı **mini oyun akışı**. Her kaydırmada karşına yeni bir oyun çıkar — beğen, oyna, rekor kır, kaydır!

## Oyunlar

| Oyun | Esinlenme | Nasıl oynanır |
|------|-----------|----------------|
| 🐤 **Zıp Kuş** | Flappy Bird | Dokunarak zıpla, borulara çarpma |
| 🎯 **Refleks** | — | Hedef kaybolmadan dokun, her seferinde hızlanır |
| 🏗️ **Kule Yap** | Stack | Kayan bloğu tam üstüne bırak |
| 🌈 **Renk Yakala** | — | Daire istenen renge dönünce dokun |
| 🐹 **Köstebek Avı** | Whack-a-Mole | Köstebeklere dokun, 3 tanesini kaçırma |
| ⚽ **Top Sektir** | Keepy-Up | Topa dokunarak havada tut |
| 💎 **Cam Kır** | Smash Hit | Üzerine gelen camları dokunarak kır |
| ⛏️ **Maden Kaz** | Minecraft | Blokları kaz, elmas topla, TNT'ye dokunma |
| 🎹 **Piyano Karoları** | Piano Tiles | Düşen siyah karolara dokun |
| 🍉 **Meyve Patlat** | Fruit Ninja | Meyveleri patlat, bombadan kaç |
| 🏃 **Koşucu** | Subway Surfers | Sola/sağa dokunarak engellerden kaç |

Tüm oyunlar **sadece dokunmayla** oynanır — dikey kaydırma her zaman bir sonraki oyuna geçirir (aynı TikTok gibi). Rekorlar cihazda saklanır.

## Hızlı başlangıç (tarayıcıda)

```bash
npm install
npm start          # http://localhost:8080
```

Tarayıcıda mobil görünüme geçirip (F12 → cihaz modu) deneyebilirsin.

## 📱 APK alma (en kolay yol: GitHub Actions)

Bu depoya her push'ta GitHub Actions otomatik olarak APK derler:

1. GitHub'da **Actions** sekmesine gir
2. Son çalışan **"Android APK Derle"** işine tıkla
3. Sayfanın altındaki **Artifacts** bölümünden `tt-scroll-debug-apk` dosyasını indir
4. Telefonuna at ve kur (Ayarlar → Bilinmeyen kaynaklara izin ver)

## 📱 Bilgisayarında derlemek istersen

Gerekenler: [Android Studio](https://developer.android.com/studio) (SDK'yı da kurar), Node.js 18+

```bash
npm install
npx cap sync android
npx cap open android    # Android Studio'da açar → Run tuşuyla telefonda çalıştır
```

## 🚀 Play Store'a Yükleme Rehberi

### Adım 1: Google Play Console hesabı aç
- [play.google.com/console](https://play.google.com/console) adresine git
- Google hesabınla kaydol — **tek seferlik 25$ ücret** var
- Kimlik doğrulamasını tamamla (1-2 gün sürebilir)

### Adım 2: İmza anahtarı (keystore) oluştur
Play Store sadece **imzalı** uygulamaları kabul eder. Bilgisayarında:

```bash
keytool -genkey -v -keystore tt-scroll.keystore -alias ttscroll \
  -keyalg RSA -keysize 2048 -validity 10000
```

> ⚠️ **ÇOK ÖNEMLİ:** Bu dosyayı ve şifresini kaybetme! Kaybedersen uygulamanı bir daha güncelleyemezsin. Google Drive gibi güvenli bir yere yedekle. Bu dosyayı asla GitHub'a yükleme (`.gitignore` zaten engelliyor).

### Adım 3: İmzalı AAB derle
`android/keystore.properties` dosyası oluştur (bu dosya git'e girmez):

```properties
storeFile=/tam/yol/tt-scroll.keystore
storePassword=ŞİFREN
keyAlias=ttscroll
keyPassword=ŞİFREN
```

`android/app/build.gradle` içindeki `android {` bloğuna imza ayarını ekle:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file("keystore.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... mevcut ayarlar ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

Sonra derle:

```bash
cd android && ./gradlew bundleRelease
# Çıktı: android/app/build/outputs/bundle/release/app-release.aab
```

### Adım 4: Play Console'da uygulama oluştur
1. Play Console → **Uygulama oluştur**
2. Ad: **TT Scroll** (veya istediğin ad), dil: Türkçe, tür: **Oyun**, ücretsiz
3. **Store girişi** bölümünü doldur:
   - Kısa açıklama (80 karakter): *"Kaydır ve oyna! Her kaydırmada yeni bir mini oyun."*
   - Uzun açıklama, uygulama simgesi (512×512), öne çıkan görsel (1024×500)
   - En az 2 telefon ekran görüntüsü (uygulamayı telefonda açıp çek)
4. **İçerik derecelendirmesi** anketini doldur (şiddet yok → herkese uygun çıkar)
5. **Veri güvenliği** formu: uygulama hiçbir veri toplamıyor → "veri toplanmıyor" seç
6. **Hedef kitle**: 13 yaş ve üzeri seçmek işini kolaylaştırır

### Adım 5: Yayınla
1. **Üretim** (Production) → **Yeni sürüm oluştur**
2. `app-release.aab` dosyasını yükle
3. Sürüm notu yaz: *"İlk sürüm 🎉"*
4. **İncelemeye gönder** — Google incelemesi genelde 1-7 gün sürer
5. Onaylanınca uygulaman Play Store'da! 🎉

### Sonraki güncellemelerde
`android/app/build.gradle` içinde `versionCode`'u 1 artır (ör. 1 → 2), `versionName`'i güncelle (ör. "1.0" → "1.1"), yeniden `bundleRelease` derle ve yeni sürüm olarak yükle.

## 🧩 Yeni oyun ekleme

1. `www/js/games/` içine yeni dosya aç ve şu arayüzü uygula:

```js
export const benimOyunum = {
  id: 'benim-oyunum',
  name: 'Oyun Adı',
  emoji: '🕹️',
  howTo: 'Nasıl oynanacağı',
  init(s) { /* s.G içine oyun durumunu koy */ },
  tap(s, x, y) { /* dokunma; skor için s.addScore(), bitirmek için s.end() */ },
  update(s, dt) { /* her karede çağrılır */ },
  draw(s, ctx) { /* s.w × s.h boyutlu canvas'a çiz */ },
};
```

2. `www/js/games/index.js` dosyasındaki listeye ekle — hepsi bu! Oyun otomatik olarak akışa karışır.
