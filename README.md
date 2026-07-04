# 🍩 Donut Timer

A multi-timer countdown web application for managing multiple parallel timers with persistent state storage. Perfect for kitchen timers, workout intervals, task scheduling, and more!

**Features:**
- ⏱️ Create and manage multiple timers simultaneously
- 📝 Add notes to each timer (with character counter + truncation)
- ✏️ Edit timer via modal popup dialog (with live countdown in header)
- 🔍 Auto-detect expired timers — shows "Finished at HH:MM"
- 👁️ Hide/Show completed timers toggle
- 💾 Persistent storage (timers saved in browser localStorage)
- 🌙 Dark mode support (auto-detected from system preferences)
- 🔊 Indonesian voice alerts when timers complete
- 🔔 Desktop notification on timer finish
- 📊 Real-time timer status summary (first start, last finish, early finish times)
- 📱 Responsive design for desktop and mobile
- 🎨 Built with Svelte and mini.css framework
- 🧪 Unit tests with Vitest (100% coverage on utils)

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
git clone https://github.com/amdersz5g7/donut-timer.git
cd donut-timer

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

1. Set a duration (minutes), number of items (default: 6), and optionally add a note.
2. Click `Add Timer` to create a new countdown. Each timer shows remaining time, items, and note.
3. Click the edit icon (✏️) to open a popup modal — adjust minutes, items, or notes and save.
4. Timers persist automatically to `localStorage` — refresh the page and they remain.
5. When a timer completes it will be marked done ("Finished at HH:MM"), trigger a voice alert, and send a desktop notification.
6. Use `Hide Completed` to toggle visibility of finished timers.
7. Delete individual timers or use `Delete All` (with confirmation) to clear everything.

---

## Project Structure (high level)

```
donut-timer/
├── src/
│   ├── App.svelte              # Main app component
│   ├── main.js                 # App bootstrap
│   ├── components/             # Extracted components
│   │   ├── TimerForm.svelte    # Add timer form
│   │   ├── TimerSummary.svelte # Timer statistics
│   │   └── EditTimerModal.svelte # Popup edit dialog
│   ├── utils/
│   │   ├── audio.js            # Web Audio API beep
│   │   ├── constants.js        # App constants
│   │   ├── debounce.js         # Debounce utility
│   │   └── timeUtils.js        # Time formatting & diff
│   ├── lib/
│   │   └── persistent.js       # localStorage store helper
│   └── scripts/
│       └── gtag.js             # GA helper
├── public/
│   ├── index.html              # HTML shell
│   ├── global.css              # Global styles
│   └── scripts/gtag.js         # GA script
├── tests/
│   └── utils/                  # Unit tests (Vitest)
├── rollup.config.js
├── vitest.config.js
├── package.json
└── package-lock.json
```

Implementation notes
- The project uses a small `src/lib/persistent.js` helper to persist Svelte stores to `localStorage`. This replaced the previous external dependency to avoid compatibility issues with newer build tools.

---

## Scripts

- `npm run dev` — start development server with watch + hot reload (port 5000)
- `npm run build` — compile optimized production bundle into `public/build`
- `npm start` — serve `public/` using `sirv-cli`
- `npm test` — run unit tests (Vitest)
- `npm run test:watch` — run tests in watch mode

---

## Internals & Technical Notes

- State: timers and small settings are persisted in `localStorage` via the local persistent store. The app keeps an ever-incrementing `ls_count` to avoid ID collisions.
- Countdown: each timer stores a `finish_full` timestamp and is updated via `setInterval` every second. Interval IDs are tracked per-timer and cleared when timers are removed.
- Alerts: voice alerts use the Web Speech API with ResponsiveVoice fallback (Indonesian). Desktop notifications are also sent on timer completion.
- Styling: uses `mini.css` for base layout + component-scoped CSS in `App.svelte` and modal components.
- Testing: unit tests are written with Vitest and cover utility functions at 100% coverage.

Security note: The original code reconstructed objects using `eval` in some older implementations. The current persistent helper stores and restores plain data (no eval) and converts date strings to `Date` objects when needed.

---

## Known issues & TODOs

- Add-minute feature (extend an active timer) is not yet implemented.

If you'd like help implementing any of the above, open an issue or a PR.

---

## License

See the `LICENSE` file at the project root.

---

## Author

Created and maintained by [amdersz5g7](https://github.com/amdersz5g7)

**Last Updated**: 2026-07-04   
**Version**: v26.07
