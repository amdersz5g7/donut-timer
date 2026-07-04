# Fix Timer Countdown Not Running After Browser Refresh

> **For Hermes:** Execute directly — single task, single file.

**Goal:** Fix bug where some timer countdowns don't start after browser refresh — caused by `use:countdwn` Svelte action firing before `timers` array is fully populated from localStorage.

**Architecture:** Replace the Svelte `use:countdwn` action (which fires during element creation, potentially before store data is ready) with an explicit `onMount` handler that starts all countdowns after DOM is fully rendered and timers are populated.

**Tech Stack:** Svelte 3, localStorage persistent stores

---

## Root Cause Analysis

### Current flow on page load:

```
1. <script> executes
2.   let timers = []                              ← empty
3.   writable("ls_timers", [])                    ← creates store from localStorage
4.   subscribe callback → timers = value          ← populated
5. </script> done
6. Template renders {#each timers as timer}
7.   <mark id="1" use:countdwn>                   ← action fires
8.     countdwn(node) → countdown(node, ...)
9.       timers.filter(t => t.tid == el.id)       ← finds timer??
```

### The problem:

Step 7-9 is the issue. The `use:countdwn` Svelte action fires during the **element creation phase** of the render. In Svelte 3, during the initial render, the `{#each}` block creates all child elements and their actions fire **immediately**. 

However, there's a subtle timing issue: when `timers = value` happens in step 4, Svelte's reactivity tracker may schedule `timers` as a dirty update but the initial DOM creation uses the **pre-dirty** state. This means:

- Some elements see `timers = []` (empty) when `use:countdwn` fires
- The timer lookup fails → `console.error("Timer not found for id:", ...)` 
- Countdown never starts
- **The card is stuck with no countdown display**

This explains the "beberapa card" (some cards) behavior — it's non-deterministic based on Svelte's internal scheduling.

### The refetch also causes this:

The store subscription callback has:
```js
requestAnimationFrame(() => {
    TimeInfo();
});
```

This triggers a reactive update that re-renders the template. When `TimeInfo()` changes summary variables, it might trigger a re-render that re-creates `{#each}` elements, re-firing `use:countdwn` — but by this point the elements may have different timing relative to the timers array.

---

## Fix: Move Countdown Init to onMount

Instead of relying on Svelte's `use:` action timing, explicitly start all countdowns in `onMount` — guaranteed to run after full DOM render and all store subscriptions are settled.

### Task 1: Replace use:countdwn with onMount-based countdown initialization

**Objective:** Ensure all timer countdowns start reliably after page load

**Files:**
- Modify: `src/App.svelte`

**Step 1: Remove `countdwn` function and `use:countdwn` from template**

Change the `<mark>` element in template (line 746-748):
```svelte
            <mark
              class="tertiary timer-{timer.tid}"
              id={timer.tid}
              use:countdwn
            ></mark>
```

To (remove `use:countdwn`):
```svelte
            <mark
              class="tertiary timer-{timer.tid}"
              id={timer.tid}
            ></mark>
```

**Step 2: Remove `countdwn` function**

Delete lines 266-268:
```js
  function countdwn(node) {
    countdown(node, maxminutes, 0);
  }
```

**Step 3: Add `startAllCountdowns()` helper**

Add before `onMount`:
```js
  function startAllCountdowns() {
    if (!timers || timers.length === 0) return;
    timers.forEach((timer) => {
      if (!timer.done && !timer.remove) {
        const el = document.getElementById(String(timer.tid));
        if (el) {
          countdown(el, timer.maxminute, 0);
        }
      }
    });
  }
```

**Step 4: Update `onMount` to call `startAllCountdowns()`**

Current `onMount`:
```js
  onMount(() => {
    // Kick off async voice loading so getVoices() returns results later
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }

    // Update summary info every second to keep seconds display reactive
    summaryInterval = setInterval(() => {
      if (timers && timers.length > 0) {
        TimeInfo();
      }
    }, 1000);
  });
```

Updated `onMount`:
```js
  onMount(() => {
    // Kick off async voice loading so getVoices() returns results later
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }

    // Start all active timer countdowns after DOM is fully rendered
    // Using setTimeout to ensure DOM elements exist and timers are populated
    setTimeout(() => {
      startAllCountdowns();
    }, 0);

    // Update summary info every second to keep seconds display reactive
    summaryInterval = setInterval(() => {
      if (timers && timers.length > 0) {
        TimeInfo();
      }
    }, 1000);
  });
```

The `setTimeout(..., 0)` defers countdown initialization to the next microtask, ensuring:
1. All DOM elements from the template are created
2. All store subscriptions have fired
3. `timers` array is fully populated

**Step 5: Also update `afterUpdate` for new timer cards**

When a new timer is added, the new card's countdown should start. Add reactive handling:

Add to `<script>`:
```js
  import { onDestroy, onMount, afterUpdate } from "svelte";
```

Add `afterUpdate`:
```js
  afterUpdate(() => {
    // Start countdowns for any new timer cards that don't have active intervals
    if (timers && timers.length > 0) {
      timers.forEach((timer) => {
        if (!timer.done && !timer.remove && !timer.timercontrol) {
          const el = document.getElementById(String(timer.tid));
          if (el) {
            countdown(el, timer.maxminute, 0);
          }
        }
      });
    }
  });
```

**Step 6: Build verification**

```bash
npm run build
```

Expected: success

**Step 7: Manual test**

1. Open browser, add 3 timers with different durations
2. Refresh browser (F5)
3. Verify: all 3 timer countdowns are running
4. Check console: no "Timer not found for id:" errors

**Step 8: Commit**

```bash
git add src/App.svelte
git commit -m "fix: start countdowns via onMount instead of use:countdwn to fix refresh bug"
```

---

## Summary

| What | Before | After |
|------|--------|-------|
| Countdown init | `use:countdwn` action (fires during element creation) | `onMount` + `setTimeout(0)` (fires after DOM ready) |
| New timer init | `use:countdwn` (automatic via action) | `afterUpdate` checking for `!timer.timercontrol` |
| Race condition | `timers` may be empty when action fires | `timers` guaranteed populated in `onMount` |

## Risks

- **Low risk**: The `countdown` function already handles cases where timer is not found, already done, etc.
- **`afterUpdate` may fire frequently**: The guard `!timer.timercontrol` prevents restarting already-running countdowns
- **Existing intervals aren't cleared on refresh**: This is fine — browsers clear all JS state on refresh

---

**Plan complete. Ready to execute. Shall I proceed?**
