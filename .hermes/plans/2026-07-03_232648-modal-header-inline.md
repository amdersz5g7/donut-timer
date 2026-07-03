# Keep Modal Header Countdown Inline with Title

> **For Hermes:** Execute directly — 1 task, 1 file.

**Goal:** Countdown text stays on same line as "Edit Timer N", not wrapped below.

**Files:** `src/components/EditTimerModal.svelte`

---

### Task 1: Change `<small>` to inline `<span>`, add nowrap

Current (line ~118-123):
```svelte
<h5 style="margin: 0;">
  Edit Timer {timerId}
  {#if remainingText}
    <small style="color: #888; font-weight: normal;">{remainingText}</small>
  {/if}
</h5>
```

Replace with:
```svelte
<h5 style="margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
  Edit Timer {timerId}
  {#if remainingText}
    <span style="color: #888; font-weight: normal; margin-left: 4px;">{remainingText}</span>
  {/if}
</h5>
```

**Build:** `npm run build`

**Commit:** `fix: keep modal header countdown inline with title`

---

**Plan complete. Execute?**
