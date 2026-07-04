# Fix Edit Button Overlapping Note Text

> **For Hermes:** Execute directly — 1 task, 1 file.

**Goal:** Fix edit button (absolute positioned, bottom-right) overlapping note text when notes are long. Button should stay visible but not cover content.

**Architecture:** Add `padding-right: 48px` to the content section to reserve space for the absolute button, plus `min-height: 40px` so the section has enough height for the button even when content is short.

**Tech Stack:** Svelte 3, CSS

---

## Current Problem

The edit button uses `position: absolute; bottom: 8px; right: 8px` inside a `<div class="section" style="position: relative;">`. When note text is multi-line (from truncation or naturally), the button floats ON TOP of the text.

```
┌──────────────────┐
│ 1 menit          │
│ 6 items          │
│ 22:30:00         │
│ 22:32:00         │
│ Donat coklat...  │ [✏️] ← button covers text
└──────────────────┘
```

## Fix

Add `padding-right: 48px` and `min-height: 40px` to the content section.

```
┌──────────────────┐
│ 1 menit           │
│ 6 items        [✏️]│ ← button in reserved space
│ 22:30:00          │
│ 22:32:00          │
│ Donat coklat...   │
└──────────────────┘
```

---

### Task 1: Add padding-right to reserve edit button space

**Objective:** Prevent edit button from overlapping text content

**Files:**
- Modify: `src/App.svelte` — line 748, the content `<div class="section">`

**Step 1: Add padding and min-height**

Current (line 748):
```svelte
            <div class="section" style="position: relative;">
```

Replace with:
```svelte
            <div class="section" style="position: relative; padding-right: 48px; min-height: 40px;">
```

**Step 2: Build verification**

```bash
npm run build
```

Expected: success

**Step 3: Browser test**

1. Add timer with long note (50+ chars)
2. Verify: edit button visible without covering text
3. Add timer with no note
4. Verify: edit button still positioned correctly (min-height ensures space)
5. Mobile viewport: button stays accessible

**Step 4: Commit**

```bash
git add src/App.svelte
git commit -m "fix: add padding-right to card section to prevent edit button overlap"
```

---

## Summary

| Before | After |
|--------|-------|
| Button overlaps text on long notes | Reserved 48px space, no overlap |
| When content is short, button still floats over | `min-height: 40px` ensures space |
| 1-line change | Zero logic impact |

---

**Plan complete. Ready to execute. Shall I proceed?**
