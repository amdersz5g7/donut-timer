# Fix removeChild Error on Timer Completion

> **For Hermes:** Execute directly — 1 task, 1 file.

**Goal:** Fix `Cannot read properties of null (reading 'removeChild')` error caused by `innerHTML` destruction of DOM elements that Svelte later tries to update.

**Root cause:** `el.parentElement.innerHTML = "Time's Up"` in `countdown()` destroys the `<mark>` element. When `timer.done` becomes true 100ms later, Svelte tries to `removeChild` the old `<mark>` node to replace it with "Finished at..." text. The node no longer exists → crash.

**Architecture:** Replace `innerHTML` with `textContent` which doesn't destroy child elements, or use a reactive variable for the countdown text.

**Tech Stack:** Svelte 3

---

### Task 1: Replace innerHTML with textContent in countdown

**Objective:** Use non-destructive DOM updates so Svelte can manage the element lifecycle

**Files:** `src/App.svelte`

**Step 1: Fix "Time's Up" innerHTML**

Current (line ~212):
```js
if (el.parentElement) {
    el.parentElement.innerHTML = "Time's Up";
}
```

Replace with:
```js
if (el.parentElement) {
    el.textContent = "Time's Up";
}
```

The `<mark>` element stays in the DOM, Svelte can properly remove it later.

**Step 2: Fix countdown update innerHTML**

Current (line ~259):
```js
timerun[i].innerHTML = timertext;
```

Replace with:
```js
timerun[i].textContent = timertext;
```

**Step 3: Build**

```bash
npm run build
```

**Step 4: Browser test**

1. Add timer 1 min, wait for completion
2. Check console — no removeChild error
3. After 100ms delay, card switches to "Finished at HH:MM" correctly

**Step 5: Commit**

```bash
git add src/App.svelte
git commit -m "fix: replace innerHTML with textContent to prevent removeChild error"
```

---

**Plan complete. Ready to execute. Shall I proceed?**
