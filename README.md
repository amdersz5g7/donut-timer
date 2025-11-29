# 🍩 Donut Timer [![Netlify Status](https://api.netlify.com/api/v1/badges/aeda9c88-9e26-4d12-a4a5-28c0c8de3c11/deploy-status)](https://app.netlify.com/projects/donut-timer/deploys)

A multi-timer countdown web application for managing multiple parallel timers with persistent state storage. Perfect for kitchen timers, workout intervals, task scheduling, and more!

**Features:**
- ⏱️ Create and manage multiple timers simultaneously
- 💾 Persistent storage (timers saved in browser localStorage)
- 🌙 Dark mode support (auto-detected from system preferences)
- 🔊 Indonesian voice alerts when timers complete
- 📊 Real-time timer status summary (first start, last finish, early finish times)
- 📱 Responsive design for desktop and mobile
- 🎨 Built with Svelte and mini.css framework

Status
- Framework: Svelte (v3)
- Build: Rollup (v2)

---

## Quick Start

### Prerequisites
- Node.js 14+ (Node 18+ recommended)

### Install & Run (Development)

```bash
# clone
git clone https://github.com/amdersz5g7/kitchen-timer.git
cd kitchen-timer

# install deps
npm install

# start dev server (Rollup watch + sirv)
npm run dev
```

Open http://localhost:5000 in your browser. The dev server supports hot-reload when you edit files under `src/`.

Note: if you hit peer-dependency warnings during `npm install`, use `npm install --legacy-peer-deps` as a fallback for older packages.

### Build / Serve (Production)

```bash
# produce optimized build into `public/build`
npm run build

# serve the built site (sirv)
npm start

# optionally expose on network
npm start -- --host 0.0.0.0
```

The production bundle is placed in `public/build/` and can be deployed to any static host (Netlify, Vercel, GitHub Pages, etc.).

---

## How to Use

1. Set a duration (minutes) and optionally the number of items (default: 6).
2. Click `Add Timer` to create a new countdown. Each timer shows remaining time and items.
3. Timers persist automatically to `localStorage` — refresh the page and they remain.
4. When a timer completes it will be marked done and trigger a voice alert (Indonesian voice).
5. You can delete individual timers or use the `Delete All` button (with confirmation) to clear everything.

---

## Project Structure (high level)

```
kitchen-timer/
├── src/
│   ├── App.svelte          # Main app component (UI + logic)
│   ├── main.js             # App bootstrap
│   ├── lib/
│   │   └── persistent.js   # small local persistent store helper (localStorage)
│   └── scripts/
│       └── gtag.js         # GA helper
├── public/
│   ├── index.html          # HTML shell
│   └── build/              # generated bundle (bundle.js, bundle.css)
├── rollup.config.js
└── package.json
```

Implementation notes
- The project uses a small `src/lib/persistent.js` helper to persist Svelte stores to `localStorage`. This replaced the previous external dependency to avoid compatibility issues with newer build tools.

---

## Scripts

- `npm run dev` — start development server with watch + hot reload (port 5000)
- `npm run build` — compile optimized production bundle into `public/build`
- `npm start` — serve `public/` using `sirv-cli`

---

## Internals & Technical Notes

- State: timers and small settings are persisted in `localStorage` via the local persistent store. The app keeps an ever-incrementing `ls_count` to avoid ID collisions.
- Countdown: each timer stores a `finish_full` timestamp and is updated via `setInterval` every second. Interval IDs are tracked per-timer and cleared when timers are removed.
- Alerts: voice alerts use ResponsiveVoice (Indonesian). If voice playback is blocked by the browser, the app falls back to visual markings.
- Styling: uses `mini.css` for base layout + component-scoped CSS in `App.svelte`.

Security note: The original code reconstructed objects using `eval` in some older implementations. The current persistent helper stores and restores plain data (no eval) and converts date strings to `Date` objects when needed.

---

## Known issues & TODOs

- Add-minute feature (extend an active timer) is currently not implemented and has a commented stub in the code.
- Consider extracting `App.svelte` into smaller components for maintainability.
- Add non-voice alert options (sound, desktop notifications).

If you'd like help implementing any of the above, open an issue or a PR.

---

## License

See the `LICENSE` file at the project root.

---

## Author

Created and maintained by [amdersz5g7](https://github.com/amdersz5g7)

**Last Updated**: 2025-11-29   
**Version**: v25.11
