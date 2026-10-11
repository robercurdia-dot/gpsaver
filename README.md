# GPsaver

An installable PWA that turns a monthly allowance into a **daily spending budget** — so you always know what you can spend today without blowing the month.

Works fully **offline**. No account, no server, no tracking. Everything lives in your phone.

## What it does

- You enter your monthly budget and the day it starts over.
- The app computes **today's safe-to-spend amount**: the remainder of the month, divided by the days left.
- When you log a purchase, it's subtracted from today. If you overspend, tomorrow starts lower; if you underspend, tomorrow starts higher.
- A small Cloudflare Worker acts as an **inbox for pending payments** so you can log an expense from your iPhone without opening the app (useful because iOS doesn't share data between Safari and an installed PWA).

## Tech

- Vanilla HTML / CSS / JavaScript — no build step.
- Service Worker with revalidate-on-every-fetch so updates ship immediately.
- `localStorage` for user data (no backend, no personal data ever leaves the device).
- Web App Manifest for install-to-home-screen on iOS and Android.
- Dark theme by default, respects `color-scheme`.

## Install

Open the site on your phone and tap "Add to Home Screen". That's it.

Alternatively, serve the directory with any static server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Repo layout

```
gpsaver/
├── index.html              # Single-page app
├── sw.js                   # Service worker (revalidate-always)
├── manifest.webmanifest    # PWA manifest
├── icon.svg / icon-*.png   # App icons
└── api/                    # Cloudflare Worker (pending-payments inbox)
```

## License

Personal project — not accepting contributions.
