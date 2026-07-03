<script>
  import { PlusCircleIcon } from "svelte-feather-icons";
  import { resumeAudio } from "../utils/audio.js";

  export let maxminutes = 75;
  export let items = 6;
  export let addTimer = () => {};
  let note = "";

  let lastAddTime = 0;
  const ADD_TIMER_COOLDOWN_MS = 500;

  function handleAdd() {
    const now = Date.now();

    // Prime/Unlock SpeechSynthesis and AudioContext on user interaction
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
    resumeAudio();

    // Request notification permission on user gesture
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
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

    addTimer({ maxminutes, items, note });
    note = "";
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
    />
  </div>
  <div class="col-sm-12" style="margin-top: 8px; margin-bottom: 4px;">
    <label for="input_note" style="margin-bottom: 0.25rem;">
      <small>Notes (optional)</small>
    </label>
    <textarea
      id="input_note"
      bind:value={note}
      rows="2"
      maxlength="200"
      style="width: 100%; margin: 0; resize: vertical; font-size: 0.9rem;"
      aria-label="Timer notes"
      placeholder="Optional note..."
    ></textarea>
    <small style="color: #888; float: right; margin-top: 2px;">
      {note.length}/200
    </small>
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
