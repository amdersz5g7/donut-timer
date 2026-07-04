# Show Live Countdown in Edit Modal Header

> **For Hermes:** Execute directly — 2 tasks, 2 files.

**Goal:** Modal header shows "Edit Timer 3 — 1 minute 25" with live countdown that updates every second while editing. Timer card countdown continues running behind the modal.

**Architecture:** Pass `finishFull` prop to modal. Modal runs its own `setInterval` to compute and display remaining time. Interval cleaned up on destroy/close.

**Tech Stack:** Svelte 3

---

### Task 1: Pass finishFull to EditTimerModal

**Objective:** Pass the timer's `finish_full` to the modal component

**Files:**
- Modify: `src/App.svelte` — `<EditTimerModal>` component line

**Step 1: Add finishFull prop**

Current:
```svelte
<EditTimerModal
  open={editingTimer !== null}
  timerId={editingTimer || 0}
  currentMinutes={modalTimer ? modalTimer.maxminute : 1}
  currentItems={modalTimer ? modalTimer.items : 1}
  currentNote={modalTimer ? modalTimer.note || "" : ""}
  on:save={handleModalSave}
  on:cancel={cancelEdit}
/>
```

Add:
```svelte
<EditTimerModal
  open={editingTimer !== null}
  timerId={editingTimer || 0}
  currentMinutes={modalTimer ? modalTimer.maxminute : 1}
  currentItems={modalTimer ? modalTimer.items : 1}
  currentNote={modalTimer ? modalTimer.note || "" : ""}
  finishFull={modalTimer ? modalTimer.finish_full : null}
  on:save={handleModalSave}
  on:cancel={cancelEdit}
/>
```

**Step 2: Build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/App.svelte
git commit -m "feat: pass finishFull to EditTimerModal for countdown header"
```

---

### Task 2: Add live countdown display in modal header

**Objective:** Display "Edit Timer N — Xm Ys" in modal header with live interval

**Files:**
- Modify: `src/components/EditTimerModal.svelte`

**Step 1: Accept finishFull prop and add countdown logic**

Add to `<script>`:
```js
  import { onDestroy } from "svelte";

  export let finishFull = null;

  let remainingText = "";
  let countdownInterval = null;

  function updateRemaining() {
    if (!finishFull) {
      remainingText = "";
      return;
    }
    const now = new Date();
    const future = new Date(finishFull);
    const diff = future - now;
    if (diff <= 0) {
      remainingText = "— Time's up";
      if (countdownInterval) clearInterval(countdownInterval);
      return;
    }
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (mins > 0) {
      remainingText = `— ${mins} minute${mins > 1 ? "s" : ""} ${secs}s`;
    } else {
      remainingText = `— ${secs}s`;
    }
  }

  $: if (open && finishFull) {
    updateRemaining();
    countdownInterval = setInterval(updateRemaining, 1000);
  } else if (!open) {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
  }

  onDestroy(() => {
    if (countdownInterval) clearInterval(countdownInterval);
  });
```

**Step 2: Update header template**

Current:
```svelte
      <div class="modal-header">
        <h5 style="margin: 0;">Edit Timer {timerId}</h5>
```

Replace with:
```svelte
      <div class="modal-header">
        <h5 style="margin: 0;">
          Edit Timer {timerId}
          {#if remainingText}
            <small style="color: #888; font-weight: normal;">{remainingText}</small>
          {/if}
        </h5>
```

**Step 3: Build**

```bash
npm run build
```

**Step 4: Browser test**

1. Add timer 1 min
2. Click edit → header shows "Edit Timer 1 — 55s"
3. Wait 10s → header updates to "Edit Timer 1 — 45s"
4. Modal close → interval stops
5. Timer expires while modal open → shows "— Time's up"

**Step 5: Commit**

```bash
git add src/components/EditTimerModal.svelte
git commit -m "feat: show live countdown in edit modal header"
```

---

## Summary

| Before | After |
|--------|-------|
| `Edit Timer 3` | `Edit Timer 3 — 1 minute 25` |
| Static header | Live countdown updates every 1s |
| No cleanup needed | Interval cleared on close/destroy |

---

**Plan complete. Ready to execute. Shall I proceed?**
