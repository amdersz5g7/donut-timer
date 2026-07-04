# Fix removeChild TypeError on Timer Operations

> **For Hermes:** Execute directly — 1 task, 1 file.

**Goal:** Fix `Cannot read properties of null (reading 'removeChild')` error caused by countdown interval trying to update DOM elements that Svelte already removed during reconciliation.

**Root cause:** When a timer finishes and `done: true` is set, Svelte re-renders and removes the `<mark>` element (replaced by "Finished at..."). But the countdown `setInterval` at line ~260 still tries to write `innerHTML` on elements that no longer exist.

**Files:** `src/App.svelte`

---

### Task 1: Add null guards to countdown interval innerHTML write

The countdown interval updates the display every second:
```js
let timerun = document.getElementsByClassName("timer-" + el.id);
let timertext = minute_text + " " + seconds + " " + second_text + "";
for (let i = 0; i < timerun.length; i++) {
    timerun[i].innerHTML = timertext;
}
```

**Fix:** Add a check — if the element no longer exists, clear the interval.

Replace:
```js
      let timerun = document.getElementsByClassName("timer-" + el.id);
      let timertext = minute_text + " " + seconds + " " + second_text + "";
      for (let i = 0; i < timerun.length; i++) {
        timerun[i].innerHTML = timertext;
      }
```

With:
```js
      let timerun = document.getElementsByClassName("timer-" + el.id);
      if (timerun.length === 0) {
        clearInterval(timerIntervalID[0]["timercontrol"]);
        return;
      }
      let timertext = minute_text + " " + seconds + " " + second_text + "";
      for (let i = 0; i < timerun.length; i++) {
        timerun[i].innerHTML = timertext;
      }
```

**Build:** `npm run build`

**Commit:** `fix: guard countdown interval against removed DOM elements`

---

**Plan complete. Execute?**
