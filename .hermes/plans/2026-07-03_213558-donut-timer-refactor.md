# Donut Timer — Refactor & Cleanup Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Refactor the monolithic App.svelte (1168 lines) into maintainable components, fix bugs, remove dead code, and improve resilience.

**Architecture:** Extract Svelte components from App.svelte (TimerCard, TimerSummary, TimerForm), reuse utility functions, add error handling, and remove duplicate/minifier redundancy.

**Tech Stack:** Svelte 3, Rollup, localStorage-based state

---

## Task 1: Fix AudioContext try-catch in audio.js

**Objective:** Wrap `new AudioContext()` in try-catch so it doesn't throw in restricted environments

**Files:**
- Modify: `src/utils/audio.js:4-9`

**Step 1: Edit audio.js**

Patch `getAudioContext()` to wrap the constructor:

```js
function getAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            try {
                audioCtx = new AudioContext();
            } catch (e) {
                console.warn('AudioContext not available:', e);
                return null;
            }
        }
    }
    return audioCtx;
}
```

Also add a null guard in `playBeep()` — it already has `if (!ctx) return;` so that's fine.

**Step 2: Verify**

Read back `src/utils/audio.js` and confirm the try-catch wraps the `new AudioContext()` call.

**Step 3: Commit**

```bash
git add src/utils/audio.js
git commit -m "fix: wrap AudioContext constructor in try-catch"
```

---

## Task 2: Fix SpeechSynthesis voices loading

**Objective:** Listen for `voiceschanged` event before reading voices in `alertvoice()`

**Files:**
- Modify: `src/App.svelte:93-122`

**Step 1: Edit alertvoice() in App.svelte**

The issue is `window.speechSynthesis.getVoices()` returns `[]` if called before the `voiceschanged` event fires. Fix by adding a helper that waits for voices:

Old code (lines 108-110):
```js
const voices = window.speechSynthesis.getVoices();
const idVoice = voices.find((v) => v.lang.includes("id"));
if (idVoice) utterance.voice = idVoice;
```

New code:
```js
const voices = window.speechSynthesis.getVoices();
const idVoice = voices.length > 0
  ? voices.find((v) => v.lang.includes("id"))
  : null;
if (idVoice) utterance.voice = idVoice;
```

This isn't a full fix (voices may still be empty), but it prevents a crash. A full fix would listen to `voiceschanged` event once on mount. Add to `onMount`:

```js
// Load speech synthesis voices
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices(); // Kick off async load
    window.speechSynthesis.addEventListener('voiceschanged', () => {
        // voices available now
    }, { once: true });
}
```

**Step 2: Commit**

```bash
git add src/App.svelte
git commit -m "fix: guard speechSynthesis.getVoices() against empty array"
```

---

## Task 3: Move Notification.requestPermission to user gesture

**Objective:** Move `Notification.requestPermission()` from `onMount` (pageload) into the `addTimer()` click handler (user gesture)

**Files:**
- Modify: `src/App.svelte:642-650` (onMount) and `src/App.svelte:381-393` (addTimer)

**Step 1: Remove from onMount**

Delete lines 643-650 (the entire Notification block in onMount):

```js
onMount(() => {
    // Request notification permission — REMOVED: moved to addTimer
    // ... delete this block

    // Update summary info every second...
    summaryInterval = setInterval(() => {
        ...
    }, 1000);
});
```

**Step 2: Add to addTimer()**

Add at the beginning of `addTimer()` function, after the existing `resumeAudio()` call:

```js
function addTimer() {
    const now = Date.now();
    // Prime/Unlock SpeechSynthesis and AudioContext on user interaction
    if ("speechSynthesis" in window) {
        window.speechSynthesis.resume();
    }
    resumeAudio();

    // Request notification permission on user gesture
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
    }

    if (now - lastAddTime < ADD_TIMER_COOLDOWN_MS) {
        alert("Tunggu sebentar sebelum menambah timer lagi");
        return;
    }
    // ... rest unchanged
```

**Step 3: Commit**

```bash
git add src/App.svelte
git commit -m "fix: request notification permission on user gesture, not pageload"
```

---

## Task 4: Remove unused imports and dead code in App.svelte

**Objective:** Clean up unused imports (`formatTime`, `sanitizeHTML`) and remove commented-out block in deleteTimer()

**Files:**
- Modify: `src/App.svelte:16` (import) and `src/App.svelte:455-458` (dead code)

**Step 1: Fix import line**

Current import:
```js
import { scrollToElementWithOffset } from "./utils/timeUtils.js";
```

No change needed — `scrollToElementWithOffset` is used. Only `formatTime` and `sanitizeHTML` from timeUtils are unused, but they're not imported in App.svelte, only in timeUtils.js itself. So this task is about removing dead code in App.svelte.

**Step 2: Remove commented-out block in deleteTimer()**

Lines 455-458:
```js
// timers.forEach(function (a, b) {
//   if (a.tid == timerId) {
//     timers[b].remove = true;
//   }
// });
```

Delete these 4 lines entirely.

**Step 3: Remove unused constants import check**

In the constants import (`src/App.svelte:17`), `SCROLL_OFFSET_PX` IS used in `countdown()` line 205. So that import is fine.

However in `constants.js`, the constants `DEFAULT_TIMER_COUNT`, `DEFAULT_MAX_MINUTES`, `DEFAULT_ITEMS`, `MIN_TIMER_DURATION`, `COUNTDOWN_INTERVAL_MS`, `VOICE_*`, `SECONDS_PER_MINUTE`, `MS_PER_*` are ALL unused anywhere in the app. The actual defaults are hardcoded as store initial values.

For this task, just clean App.svelte. Constants cleanup is Task 5.

**Step 4: Commit**

```bash
git add src/App.svelte
git commit -m "chore: remove dead commented-out code in deleteTimer"
```

---

## Task 5: Clean up unused constants in constants.js

**Objective:** Remove constants that are never imported or used anywhere

**Files:**
- Modify: `src/utils/constants.js`

**Step 1: Check which constants are actually used**

Used:
- `SCROLL_OFFSET_PX` — imported in App.svelte line 17, used line 205
- `STICKY_THRESHOLD` — defined in App.svelte line 21 (inline), NOT from constants
- `SCROLL_DEBOUNCE_MS` — defined in App.svelte line 22 (inline), NOT from constants
- `ADD_TIMER_COOLDOWN_MS` — defined in App.svelte line 23 (inline), NOT from constants

So these 3 are duplicated — defined both in constants.js AND inline in App.svelte. Since App.svelte uses inline constants, the constants.js versions are unused.

**Step 2: Replace constants.js with only what's used**

New constants.js:
```js
/**
 * Application constants
 */

// UI thresholds
export const SCROLL_OFFSET_PX = 20; // Extra margin when scrolling to element (only used one)
```

**Step 3: Commit**

```bash
git add src/utils/constants.js
git commit -m "chore: remove unused constants, keep only SCROLL_OFFSET_PX"
```

---

## Task 6: Remove duplicate uglify plugin from rollup.config.js

**Objective:** Remove `rollup-plugin-uglify` which runs redundantly alongside `rollup-plugin-terser`

**Files:**
- Modify: `rollup.config.js:6,52`

**Step 1: Remove uglify import**

Delete line 6:
```js
import { uglify } from "rollup-plugin-uglify";
```

**Step 2: Remove uglify() from plugins**

Delete line 52:
```js
uglify()
```

**Step 3: Commit**

```bash
git add rollup.config.js
git commit -m "chore: remove redundant rollup-plugin-uglify (terser already minifies)"
```

---

## Task 7: Fix timer edit to recalculate from `now`, not `original_start`

**Objective:** When editing a timer, calculate new finish time from `now + editMinutes` instead of `original_start + editMinutes`

**Files:**
- Modify: `src/App.svelte:521-540`

**Step 1: Fix saveEditTimer calculation**

Current (buggy):
```js
let xfinish_at = new Date(xstart_at.getTime() + editMinutes * 60000);
```

Fixed:
```js
let xfinish_at = new Date(now.getTime() + editMinutes * 60000);
```

But we need to declare `now` before this line. Currently `now` is declared at line 529:
```js
let now = new Date();
```

Move `let now = new Date();` BEFORE the xfinish_at calculation. So:

```js
const timerIndex = timers.findIndex((t) => t.tid === timerId);
if (timerIndex === -1) return;
const timer = timers[timerIndex];

let now = new Date();
let xfinish_at = new Date(now.getTime() + editMinutes * 60000);

// Validate: finish time must be in the future
if (xfinish_at <= now) {
    // ... alert ...
    return;
}
```

**Step 2: Commit**

```bash
git add src/App.svelte
git commit -m "fix: edit timer calculates finish from now, not original start time"
```

---

## Task 8: Extract TimerForm component (add timer form)

**Objective:** Extract the timer input form (minutes, items, add button) from App.svelte into its own component

**Files:**
- Create: `src/components/TimerForm.svelte`
- Modify: `src/App.svelte` (replace form section with import)

**Step 1: Create TimerForm.svelte**

```svelte
<script>
  import { PlusCircleIcon } from "svelte-feather-icons";
  import { writable } from "../lib/persistent.js";
  import { resumeAudio } from "../utils/audio.js";
  import { ADD_TIMER_COOLDOWN_MS } from "../utils/constants.js";

  export let onAddTimer = () => {};
  export let maxminutes = 75;
  export let items = 6;
  export let onMaxminutesChange = (v) => {};
  export let onItemsChange = (v) => {};

  let lastAddTime = 0;

  function handleAdd() {
    const now = Date.now();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
    resumeAudio();

    // Request notification permission on user gesture
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (now - lastAddTime < ADD_TIMER_COOLDOWN_MS) {
      alert("Tunggu sebentar sebelum menambah timer lagi");
      return;
    }
    lastAddTime = now;

    if (!maxminutes || maxminutes < 1 || !Number.isFinite(maxminutes)) {
      alert("Menit harus lebih besar dari 0");
      return;
    }

    onAddTimer({
      maxminutes,
      items,
      start: new Date(),
      count: 0, // parent will set this
    });
  }
</script>

<div class="row">
  <div class="col-sm-3" style="display: flex; flex-direction: column;">
    <label for="input_menit" style="margin-bottom: 0.25rem;">
      <small>Minutes</small>
    </label>
    <input
      type="number"
      id="input_menit"
      placeholder="minutes"
      bind:value={maxminutes}
      style="margin: 0;"
      min="1"
      aria-label="Timer duration in minutes"
      aria-required="true"
    />
  </div>
  <div class="col-sm-3" style="display: flex; flex-direction: column;">
    <label for="input_items" style="margin-bottom: 0.25rem;">
      <small>Items</small>
    </label>
    <input
      type="number"
      id="input_items"
      placeholder="items"
      bind:value={items}
      min="1"
      style="margin: 0;"
      aria-label="Number of items"
      aria-required="true"
      on:change={() => {
        if (!Number.isInteger(items) || items < 1) {
          items = 6;
        }
        onItemsChange(items);
      }}
    />
  </div>
  <div
    class="col-sm-6"
    style="display: flex; align-items: flex-end; padding: 0 calc(var(--universal-padding) / 2);"
  >
    <button
      on:click={handleAdd}
      aria-label="Add new timer"
      class="xprimary primary shadowed"
      style="width: 100%; margin: 0; padding: 7px 0px;"
    >
      <span style="position: relative; top: 3px;">
        <PlusCircleIcon size="20" />
      </span>
      <span>Add Timer</span>
    </button>
  </div>
</div>
```

**Step 2: Import TimerForm in App.svelte**

Add import at top of App.svelte's script:
```js
import TimerForm from "./components/TimerForm.svelte";
```

Replace the form section (lines 730-782) with:
```svelte
<TimerForm
  {maxminutes}
  {items}
  onMaxminutesChange={(v) => ls_maxminutes.set(v)}
  onItemsChange={(v) => ls_items.set(v)}
  onAddTimer={({ maxminutes, items, start }) => {
    ls_maxminutes.set(maxminutes);
    let xstart_at = start;
    let xfinish_at = new Date(xstart_at.getTime() + maxminutes * 60000);
    let xstart = formatTime(xstart_at);
    let xfinish = formatTime(xfinish_at);
    timers = timers.concat({
      tid: count,
      remove: false,
      text: "Timer " + count,
      start_at: xstart,
      finish_at: xfinish,
      maxminute: maxminutes,
      items: items,
      start_full: xstart_at,
      finish_full: xfinish_at,
      done: false,
    });
    ls_timers.set(timers);
    count += 1;
    ls_count.set(count);
    TimeInfo();
  }}
/>
```

Note: this requires importing `formatTime` from timeUtils.js into App.svelte now.

**Step 3: Commit**

```bash
git add src/components/TimerForm.svelte src/App.svelte
git commit -m "refactor: extract TimerForm component from App.svelte"
```

---

## Task 9: Extract TimerSummary component

**Objective:** Extract the summary header (timers stats) into its own component

**Files:**
- Create: `src/components/TimerSummary.svelte`
- Modify: `src/App.svelte`

**Step 1: Create TimerSummary.svelte**

```svelte
<script>
  export let firststart = "-";
  export let lastfinish = "-";
  export let earlyfinish = "-";
  export let timeractive = "-";
  export let timerdone = "-";
  export let count = 1;
  export let hideCompletedTimers = false;
  export let onToggleHide = () => {};
</script>

<centerx>
  <div id="summary" class="containerx">
    {#if count > 1}
      <div class="row">
        <div class="col-sm-6">
          <h6><small>Early Start</small> {firststart}</h6>
        </div>
        <div class="col-sm-6">
          <h6>
            <small>Timers</small>
            {#if timeractive === "-" && timerdone === "-"}
              -
            {:else if timeractive === 0 && timerdone > 0}
              {timerdone} done
            {:else if timeractive > 0 && timerdone === 0}
              {timeractive} active
            {:else}
              {timeractive} active, {timerdone} done
            {/if}
          </h6>
        </div>
      </div>
      <div class="row">
        <div class="col-sm-6">
          <h6><small>Early Finish</small> {earlyfinish}</h6>
        </div>
        <div class="col-sm-6">
          <h6><small>Last Finish</small> {lastfinish}</h6>
        </div>
      </div>
    {/if}
  </div>
</centerx>
```

**Step 2: Import in App.svelte and replace section**

Replace the summary HTML block (lines 728-825) with:
```svelte
<TimerSummary
  {firststart}
  {lastfinish}
  {earlyfinish}
  {timeractive}
  {timerdone}
  {count}
  {hideCompletedTimers}
/>
```

**Step 3: Commit**

```bash
git add src/components/TimerSummary.svelte src/App.svelte
git commit -m "refactor: extract TimerSummary component from App.svelte"
```

---

## Task 10: Extract TimerCard component

**Objective:** Extract the individual timer card (display, edit mode, countdown) into its own component

**Files:**
- Create: `src/components/TimerCard.svelte`
- Modify: `src/App.svelte`

**Step 1: Create TimerCard.svelte**

This is the largest extraction. The card shows:
- Timer header with delete button
- Edit mode (when editingTimer === timer.tid)
- Display mode (timer info: minutes, items, start, finish, edit button)
- Countdown display area

It receives a timer object and emits events for save/delete/edit.

**Step 2: Import in App.svelte**

The each loop in App.svelte (lines 828-945) gets replaced with:
```svelte
{#each timers as timer (timer.tid)}
  {#if !timer.remove && !(hideCompletedTimers && timer.done)}
    <TimerCard
      {timer}
      editingTimer={editingTimer}
      editMinutes={editMinutes}
      editItems={editItems}
      on:delete={(e) => deleteTimer(e.detail)}
      on:edit={(e) => startEditTimer(e.detail)}
      on:save={(e) => saveEditTimer(e.detail.timerId, e.detail.minutes, e.detail.items)}
      on:cancel={cancelEdit}
      on:mount={(e) => countdown(e.detail, e.detail.maxminute, 0)}
    />
  {/if}
{/each}
```

**Step 3: Commit**

```bash
git add src/components/TimerCard.svelte src/App.svelte
git commit -m "refactor: extract TimerCard component from App.svelte"
```

---

## Task 11: Remove inline styles to CSS classes

**Objective:** Reduce `!important` usage and inline styles by moving common patterns to CSS classes

**Files:**
- Modify: `src/App.svelte` (style section + template)

**Step 1: Audit !important usage**

Current locations (from review):
- `App.svelte:1035-1037` — `.card.card-off > div *`
- `App.svelte:1077-1087` — `.toggle-show-btn`
- `App.svelte:1093-1094` — `button.secondary` (padding/border-radius)
- `App.svelte:1102-1107` — `.edit-timer-btn`
- `App.svelte:1118-1128` — `.edit-timer-btn dark mode`

The main issue is specificity conflict with mini.css framework. Fix by increasing selector specificity instead of using !important.

**Step 2: Replace !important with higher specificity**

For toggle-show-btn:
```css
.card.fluid .toggle-show-btn {
    background: #43a047;
    color: white;
    border: 1px solid #388e3c;
}
```

For edit-timer-btn:
```css
.card.fluid .edit-timer-btn {
    background: #f57c00;
    color: white;
    border: 1px solid #ef6c00;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
```

**Step 3: Commit**

```bash
git add src/App.svelte
git commit -m "refactor: replace !important with higher specificity selectors"
```

---

## Task 12: Add basic unit tests for utility functions

**Objective:** Add Vitest tests for `src/utils/` functions

**Files:**
- Create: `tests/utils/timeUtils.test.js`
- Modify: `package.json` (add test script + devDep)

**Step 1: Install vitest**

```bash
npm install --save-dev vitest
```

Add to package.json scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 2: Create timeUtils tests**

```js
import { describe, it, expect } from 'vitest';
import { formatTime, diffMinutes, sanitizeHTML, scrollToElementWithOffset } from '../../src/utils/timeUtils.js';

describe('formatTime', () => {
    it('formats date to HH:MM:SS', () => {
        const date = new Date(2024, 0, 1, 14, 5, 9);
        expect(formatTime(date)).toBe('14:05:09');
    });
    it('pads single digits', () => {
        const date = new Date(2024, 0, 1, 8, 3, 2);
        expect(formatTime(date)).toBe('08:03:02');
    });
});

describe('diffMinutes', () => {
    it('returns 0 if now is past future', () => {
        const now = new Date('2024-01-01T14:00:00');
        const future = new Date('2024-01-01T13:00:00');
        expect(diffMinutes(now, future)).toEqual({ m: 0, s: 0 });
    });
    it('calculates minutes and seconds', () => {
        const now = new Date('2024-01-01T14:00:00');
        const future = new Date('2024-01-01T15:30:45');
        const result = diffMinutes(now, future);
        expect(result.m).toBe(90);
        expect(result.s).toBe(45);
    });
});

describe('sanitizeHTML', () => {
    it('escapes HTML tags', () => {
        expect(sanitizeHTML('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });
    it('preserves safe text', () => {
        expect(sanitizeHTML('Hello World')).toBe('Hello World');
    });
});
```

**Step 3: Create debounce tests**

```js
import { describe, it, expect, vi } from 'vitest';
import { debounce } from '../../src/utils/debounce.js';

describe('debounce', () => {
    it('only calls function after wait period', async () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);
        debounced();
        debounced();
        debounced();
        expect(fn).not.toHaveBeenCalled();
        await new Promise(r => setTimeout(r, 150));
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
```

**Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass.

**Step 5: Commit**

```bash
git add package.json tests/ src/utils/
git commit -m "test: add unit tests for timeUtils and debounce"
```

---

## Task 13: Update README.git URL and footer link

**Objective:** Fix the GitHub URL in footer (points to `www.github.com` instead of actual repo) and README

**Files:**
- Modify: `src/App.svelte:1014`
- Modify: `README.md` (if git URL is wrong)

**Step 1: Fix footer link**

Change:
```svelte
<a href="https://www.github.com">
```
To:
```svelte
<a href="https://github.com/amdersz5g7/donut-timer">
```

**Step 2: Commit**

```bash
git add src/App.svelte
git commit -m "fix: update footer GitHub link to actual repo URL"
```

---

## Summary of all changes

| # | Task | Files | Priority |
|---|------|-------|----------|
| 1 | AudioContext try-catch | `audio.js` | 🔴 High |
| 2 | SpeechSynthesis guard | `App.svelte` | 🔴 High |
| 3 | Notification on gesture | `App.svelte` | 🔴 High |
| 4 | Remove dead code | `App.svelte` | 🟡 Medium |
| 5 | Clean unused constants | `constants.js` | 🟡 Medium |
| 6 | Remove redundant uglify | `rollup.config.js` | 🟡 Medium |
| 7 | Fix timer edit bug | `App.svelte` | 🔴 High |
| 8 | Extract TimerForm | `components/TimerForm.svelte`, `App.svelte` | 🟡 Medium |
| 9 | Extract TimerSummary | `components/TimerSummary.svelte`, `App.svelte` | 🟡 Medium |
| 10 | Extract TimerCard | `components/TimerCard.svelte`, `App.svelte` | 🟡 Medium |
| 11 | Fix !important CSS | `App.svelte` | 🟡 Medium |
| 12 | Add unit tests | `tests/`, `package.json` | 🟢 Low |
| 13 | Fix GitHub URL | `App.svelte` | 🟢 Low |

## Tests / Validation

After each task:
1. `npm run build` — must succeed
2. For task 12: `npm test` — all pass

Full manual QA:
1. Add timer → verify countdown ticks every second
2. Edit timer → verify new finish is `now + minutes`, not `original_start + minutes`
3. Delete timer → verify removed from UI
4. Hide completed → verify completed timers hidden
5. Dark mode → verify theme applies

## Risks & Open Questions

- Extracting components (Tasks 8-10) is the riskiest — Svelte's `use:countdwn` directive and `bind:value` patterns need careful handling
- The countdown function (`countdown`) uses direct DOM manipulation (`innerHTML`, `getElementById`) which fights Svelte reactivity. Full migration to reactive patterns is out of scope for this plan
- `TimerCard` extraction may need the `countdown` function to remain in App.svelte due to closure over `timers` state — consider passing as prop or moving to a store

---

**Plan complete. Ready to execute using subagent-driven-development — I'll dispatch a fresh subagent per task with two-stage review (spec compliance then code quality). Shall I proceed?**
