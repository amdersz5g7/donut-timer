<script>
  import { SaveIcon, XIcon } from "svelte-feather-icons";
  import { createEventDispatcher, onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  export let open = false;
  export let timerId = 0;
  export let currentMinutes = 1;
  export let currentItems = 1;
  export let currentNote = "";
  export let finishFull = null;

  let editMinutes = currentMinutes;
  let editItems = currentItems;
  let editNote = currentNote;

  // Reset state when opening
  $: if (open) {
    editMinutes = currentMinutes;
    editItems = currentItems;
    editNote = currentNote || "";
  }

  // Live countdown display in header
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
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
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

  $: if (open) {
    updateRemaining();
    if (!countdownInterval) {
      countdownInterval = setInterval(updateRemaining, 1000);
    }
  } else {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  onDestroy(() => {
    if (countdownInterval) clearInterval(countdownInterval);
  });

  function handleSave() {
    if (!editMinutes || editMinutes < 1 || !Number.isFinite(editMinutes)) {
      alert("Menit harus lebih besar dari 0");
      return;
    }
    if (!editItems || editItems < 1 || !Number.isInteger(editItems)) {
      alert("Items harus lebih besar dari 0");
      return;
    }
    dispatch("save", {
      timerId,
      minutes: editMinutes,
      items: editItems,
      note: editNote,
    });
  }

  function handleCancel() {
    dispatch("cancel");
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      handleCancel();
    }
  }
</script>

<svelte:window on:keydown={open ? handleKeydown : null} />

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="modal-backdrop"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-label="Edit Timer {timerId}"
  >
    <div class="modal-card">
      <div class="modal-header">
        <h5 style="margin: 0; white-space: nowrap;">
          Edit Timer {timerId}
          {#if remainingText}
            <span style="color: #888; font-weight: normal; margin-left: 4px;">{remainingText}</span>
          {/if}
        </h5>
        <button
          class="secondary"
          on:click={handleCancel}
          style="margin: 0; padding: 4px 8px;"
          aria-label="Close modal"
        >
          <XIcon size="18" />
        </button>
      </div>

      <div class="modal-body">
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <div style="flex: 1;">
            <label for="modal-minutes" style="display: block; margin-bottom: 4px;">
              <small>Minutes</small>
            </label>
            <input
              type="number"
              id="modal-minutes"
              bind:value={editMinutes}
              min="1"
              style="width: 100%; margin: 0;"
              aria-label="Edit timer duration in minutes"
            />
          </div>
          <div style="flex: 1;">
            <label for="modal-items" style="display: block; margin-bottom: 4px;">
              <small>Items</small>
            </label>
            <input
              type="number"
              id="modal-items"
              bind:value={editItems}
              min="1"
              style="width: 100%; margin: 0;"
              aria-label="Edit number of items"
            />
          </div>
        </div>

        <div style="margin-bottom: 4px;">
          <label for="modal-note" style="display: block; margin-bottom: 4px;">
            <small>Notes</small>
          </label>
          <textarea
            id="modal-note"
            bind:value={editNote}
            rows="2"
            maxlength="200"
            style="width: 100%; margin: 0; resize: vertical; font-size: 0.9rem;"
            placeholder="Optional note..."
          ></textarea>
          <small style="color: #888; float: right; margin-top: 2px;">
            {editNote.length}/200
          </small>
        </div>
      </div>

      <div class="modal-footer">
        <button
          on:click={handleSave}
          class="primary"
          style="flex: 1; margin: 0;"
          aria-label="Save changes"
        >
          <span style="position: relative; top: 3px;">
            <SaveIcon size="16" aria-hidden="true" />
          </span>
          Save
        </button>
        <button
          on:click={handleCancel}
          class="secondary"
          style="flex: 1; margin: 0;"
          aria-label="Cancel editing"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  .modal-card {
    background: var(--back-color, #fff);
    border-radius: 8px;
    width: 90%;
    max-width: 440px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.25s ease;
  }

  @media (prefers-color-scheme: dark) {
    .modal-card {
      background: #2a2e33;
      border: 1px solid #464f57;
    }
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px 20px 0 20px;
  }

  .modal-body {
    padding: 16px 20px;
  }

  .modal-footer {
    display: flex;
    gap: 8px;
    padding: 0 20px 16px 20px;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>
