# Informative Display for Expired Timers After Refresh

> **For Hermes:** Execute directly — 2 tasks, 1 file.

**Goal:** When browser refreshes with timers that already expired (finish time in past), immediately mark them as done and show a friendly message like "Finished at 14:30" instead of a stale countdown or blank state.

**Architecture:** 
1. Auto-detect expired timers in `startAllCountdowns()` — if `finish_full` is in the past, set `done: true` immediately and skip the countdown interval.
2. Replace the imperatively-set "Time's Up" with a Svelte-reactive display in the template — done timers show "Finished at HH:MM", active timers show the live countdown mark.

**Tech Stack:** Svelte 3

---

## Current Problem

After refresh with expired-but-not-done timer:
1. `startAllCountdowns()` starts the countdown interval
2. Countdown sees `diff_minutes(now, past_time) = {m:0, s:0}`
3. Shows "Time's Up" — but the interval keeps running for 3 more seconds
4. After 3 seconds, finally sets `done: true`
5. User sees a brief flash of countdown → "Time's Up" → card-off style

Also: if the timer finished long ago, "Time's Up" is less useful than "Finished at 14:30".

---

### Task 1: Auto-detect expired timers on page load

**Objective:** In `startAllCountdowns()`, detect timers whose `finish_full` is already past and mark them `done: true` immediately instead of starting a wasteful countdown.

**Files:**
- Modify: `src/App.svelte`

**Step 1: Add expired timer detection to `startAllCountdowns()`**

Replace current function (lines 266-276) with:

```js
  function startAllCountdowns() {
    if (!timers || timers.length === 0) return;
    let changed = false;
    const now = new Date();
    timers.forEach((timer) => {
      if (timer.remove) return;
      if (timer.done) return;

      const finishTime = new Date(timer.finish_full);
      // Timer already expired — mark as done immediately
      if (finishTime <= now) {
        timer.done = true;
        changed = true;
        const el = document.getElementById(String(timer.tid));
        if (el && el.parentElement) {
          el.parentElement.innerHTML = "Time's Up";
        }
        return;
      }

      // Timer still running — start countdown
      const el = document.getElementById(String(timer.tid));
      if (el) {
        countdown(el, timer.maxminute, 0);
      }
    });
    // Persist the done state change to localStorage
    if (changed) {
      ls_timers.set(timers);
    }
  }
```

**Step 2: Build verification**

```bash
npm run build
```

Expected: success

**Step 3: Commit**

```bash
git add src/App.svelte
git commit -m "fix: auto-detect expired timers on page load, mark as done immediately"
```

---

### Task 2: Replace "Time's Up" with informative "Finished at HH:MM"

**Objective:** Instead of imperatively writing "Time's Up" via innerHTML, use Svelte reactivity to show `"Finished at 14:30"` in the countdown area when timer is done.

**Files:**
- Modify: `src/App.svelte`

**Step 1: Replace countdown mark section in template**

Current (lines 769-775):
```svelte
            <div class="section to-center">
              <mark
                class="tertiary timer-{timer.tid}"
                id={timer.tid}
              ></mark>
            </div>
```

Replace with:
```svelte
            <div class="section to-center">
              {#if timer.done}
                <small style="color: #888;">
                  Finished at {timer.finish_at}
                </small>
              {:else}
                <mark
                  class="tertiary timer-{timer.tid}"
                  id={timer.tid}
                ></mark>
              {/if}
            </div>
```

This means:
- **Active timers**: `<mark>` element (countdown via `countdown()` function)
- **Done timers**: "Finished at 14:30" text

**Step 2: Update countdown function — remove innerHTML write**

In `countdown()`, when timer finishes (lines 194-219), the `el.parentElement.innerHTML = "Time's Up"` is no longer needed since the template handles the done state reactively. However, the countdown mark still needs to show "Time's Up" during the 3-second delay before `done: true` is set.

Keep the `el.parentElement.innerHTML = "Time's Up"` at line 215 — but this won't conflict with the template since the `{#if timer.done}` branch won't render until `done: true` is actually set. By the time `done: true` is set (after 3s), the innerHTML is already "Time's Up". Svelte will replace the `<mark>` with "Finished at HH:MM" when `done: true` triggers a re-render.

Actually, there's a subtle issue: during the 3-second window between countdown hitting 0 and `done: true` being set, the timer is NOT considered done in the template, so the `<mark>` element is still rendered. The countdown function sets innerHTML on the PARENT element (`el.parentElement`), not on the `<mark>` itself. The `<mark>` is at `id={timer.tid}`, and the parent is `<div class="section to-center">`.

Wait, looking at the code:
```js
if (el.parentElement) {
    el.parentElement.innerHTML = "Time's Up";
}
```

This replaces the ENTIRE contents of the `<div class="section to-center">` with "Time's Up", destroying the `<mark>` element. When `done: true` is set 3 seconds later, Svelte re-renders and the template shows "Finished at HH:MM".

This works but the innerHTML approach still feels fragile. Let me keep it for now — the key improvement is:
1. Expired timers detected immediately on load (Task 1)
2. Done timers show "Finished at HH:MM" reactively (Task 2)

**Step 3: Also update `startAllCountdowns()` to not write innerHTML for expired timers**

Since the template now handles the done display, in the expired-timer detection (Task 1), we can skip the innerHTML write and just set `timer.done = true`:

```js
      if (finishTime <= now) {
        timer.done = true;
        changed = true;
        // Don't write innerHTML — template will show "Finished at HH:MM" reactively
        return;
      }
```

**Step 4: Build verification**

```bash
npm run build
```

Expected: success

**Step 5: Browser test**

1. Add timer with 1 min duration  
2. Wait for it to expire (or set timer to 0 min for quick test — actually can't do 0, min is 1)
3. After it finishes, refresh browser
4. Verify: shows "Finished at HH:MM" instead of "Time's Up" or blank

**Step 6: Commit**

```bash
git add src/App.svelte
git commit -m "feat: show 'Finished at HH:MM' for done timers instead of 'Time's Up'"
```

---

## Summary

| # | Task | Files |
|---|------|-------|
| 1 | Auto-detect expired timers, mark done immediately | `App.svelte` |
| 2 | Replace "Time's Up" with reactive "Finished at HH:MM" | `App.svelte` |

## Visual Change

| Before | After |
|--------|-------|
| Refresh → countdown starts → "Time's Up" → 3s → done | Refresh → immediate "Finished at 14:30" |
| "Time's Up" text via innerHTML | "Finished at 14:30" via Svelte template |
| 3-second wasted interval | Direct done flag, no interval |

---

**Plan complete. Ready to execute. Shall I proceed?**
