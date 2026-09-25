# TODO / asset map

## 1. Background song (Music button)

| Place the file here | Wired in |
| --- | --- |
| **`assets/audio/bg.mp3`** | `<audio id="bgMusic">` in `index.html` · toggled by the top-bar **Music** chip in `script.js` |

Notes:

- Drop any soft MP3 as **exactly** `bg.mp3` (filename matters).
- Keep it reasonably small (ideally under ~5–8 MB) for GitHub Pages.
- Until the file exists, tapping Music shows a toast: *Add assets/audio/bg.mp3 to enable music*.
- Tap / click sounds use a separate file: `assets/audio/bloop.mp3` (already present).

```
assets/audio/
  bg.mp3      ← add your song here
  bloop.mp3   ← already wired (UI taps)
  README.md
```

---

## 2. Images in `assets/` — where each one appears

### `assets/images/`

| File | Used on the site |
| --- | --- |
| **`couple-2.jpg`** | Hero background photo · Memories row (“forehead to forehead”) |
| **`couple-hero.jpg`** | Invite section — main couple portrait |
| **`couple-3.jpg`** | Memories row — looking at each other |
| **`hands-held.png`** | Memories — henna hands strip · Venue section large photo |
| **`bg-watermark.png`** | Soft full-page watermark via CSS (`styles.css` body / grain layer background) |

### `assets/icons/`

| File | Used on the site |
| --- | --- |
| **`favicon.svg`** | Browser tab icon (SVG) |
| **`favicon.png`** | PNG favicon (32×32) + Apple touch icon |
| **`favicon-64.png`** | Present in the folder — **not referenced yet** (optional higher-res favicon) |

### Not image assets (audio)

| File | Used on the site |
| --- | --- |
| **`assets/audio/bloop.mp3`** | Soft click / bloop on taps |
| **`assets/audio/bg.mp3`** | Background music — **missing until you add it** |

---

## 3. Deploy reminder

Repo is `*.github.io` → GitHub Pages serves **`main` branch, site root (`/`)**.

- Push to `main` → Pages rebuilds automatically.
- No Actions workflow required for this setup.
- Live URL: https://gomathishankarwedspreetha.github.io/
