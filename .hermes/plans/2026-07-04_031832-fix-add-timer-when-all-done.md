# Fix: Add Timer Not Working When All Cards Are Done

> **For Hermes:** Execute directly — 1 task, 1 file.

**Root cause:** In `startAllCountdowns()` (on page load), `timer.done = true` is set via DIRECT MUTATION, not immutable update. When all timers are `done: true`, Svelte's reactivity tracking misses the mutation and the template may not properly update when new timers are added. Additionally, the `requestAnimationFrame` deferred `TimeInfo()` call in the store subscription may run with stale data.

**Fix:** Replace direct mutation `timer.done = true` with `timers = timers.map(...)` immutable update in `startAllCountdowns()`, and ensure `TimeInfo()` is called synchronously after the change.

**Architecture:** Use `timers.map()` to create new array with `done: true` for expired timers, then call `TimeInfo()` immediately. This ensures Svelte detects the array change and re-renders.

**Tech Stack:** Svelte 3

---

### Task 1: Fix immutable update in startAllCountdowns

**Objective:** Ensure Svelte reactivity works when all timers are done and new ones are added

**Files:** `src/App.svelte`

**Step 1: Replace `startAllCountdowns()` with immutable version**

Current (~line 263):
```js
function startAllCountdowns() {
    if (!timers || timers.length === 0) return;
    let changed = false;
    const now = new Date();
    timers.forEach((timer) => {
        if (timer.remove) return;
        if (timer.done) return;

        const finishTime = new Date(timer.finish_full);
        if (finishTime <= now) {
            timer.done = true;           // ← MUTATION
            changed = true;
            return;
        }

        const el = document.getElementById(String(timer.tid));
        if (el) {
            countdown(el, timer.maxminute, 0);
        }
    });
    if (changed) {
        ls_timers.set(timers);
    }
}
```

Replace with:
```js
function startAllCountdowns() {
    if (!timers || timers.length === 0) return;
    let changed = false;
    const now = new Date();
    timers = timers.map((timer) => {
        if (timer.remove || timer.done) return timer;

        const finishTime = new Date(timer.finish_full);
        if (finishTime <= now) {
            changed = true;
            return { ...timer, done: true };  // ← IMMUTABLE
        }

        const el = document.getElementById(String(timer.tid));
        if (el) {
            countdown(el, timer.maxminute, 0);
        }
        return timer;
    });
    if (changed) {
        ls_timers.set(timers);
        TimeInfo();                          // ← sync call
    }
}
```

**Step 2: Also fix countdown's "done" setTimeout (around line 239)**

Current:
```js
setTimeout(() => {
    timers = timers.map((timer) =>
        timer.tid === timerId ? { ...timer, done: true } : timer,
    );
    ls_timers.set(timers);
}, 3000); // ← 3 second delay
```

Reduce to 100ms for near-immediate feedback:
```js
setTimeout(() => {
    timers = timers.map((timer) =>
        timer.tid === timerId ? { ...timer, done: true } : timer,
    );
    ls_timers.set(timers);
    TimeInfo();
}, 100);
```

**Step 3: Build**

```bash
npm run build
```

**Step 4: Browser test**

1. Add 3 timers, wait for all to expire
2. Click Add Timer → verify new timer card appears immediately
3. No refresh needed

**Step 5: Commit**

```bash
git add src/App.svelte
git commit -m "fix: immutable update in startAllCountdowns to fix add-timer when all done"
```

---

**Plan complete. Ready to execute. Shall I proceed?**
