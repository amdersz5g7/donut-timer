<script>
  import {
    Trash2Icon,
    ClockIcon,
    TargetIcon,
    StopCircleIcon,
    PackageIcon,
    EditIcon,
  } from "svelte-feather-icons";
  import { writable } from "./lib/persistent.js";
  import { onDestroy, onMount, afterUpdate } from "svelte";
  import { debounce } from "./utils/debounce.js";
  import { scrollToElementWithOffset } from "./utils/timeUtils.js";
  import { SCROLL_OFFSET_PX } from "./utils/constants.js";
  import { playBeep } from "./utils/audio.js";
  import TimerForm from "./components/TimerForm.svelte";
  import TimerSummary from "./components/TimerSummary.svelte";
  import EditTimerModal from "./components/EditTimerModal.svelte";

  // Constants
  const STICKY_THRESHOLD = 0.4; // 40% of viewport
  const SCROLL_DEBOUNCE_MS = 100; // 100ms debounce

  // Export prop to handle external props passed to component
  export let name = "Donut Timer";

  let hours, minutes, seconds;
  let minuteadd = 0;
  let firststart = "-",
    lastfinish = "-",
    timeractive = "-",
    timerdone = "-",
    earlyfinish = "-";
  let header, sticky;

  // Persistent state for hide completed timers toggle
  let ls_hideCompleted_val = false;
  const ls_hideCompleted = writable("ls_hideCompleted", false);
  const unsubscribe_hideCompleted = ls_hideCompleted.subscribe((value) => {
    ls_hideCompleted_val = value !== undefined ? value : false;
  });
  let hideCompletedTimers = ls_hideCompleted_val;

  let summaryInterval; // Interval for updating summary time reactively

  // Fixed: Proper initialization with fallback values
  let ls_count_val = 1;
  const ls_count = writable("ls_count", 1);
  const unsubscribe_count = ls_count.subscribe((value) => {
    ls_count_val = value || 1;
  });
  let count = ls_count_val;

  let ls_maxminutes_val = 75;
  const ls_maxminutes = writable("ls_maxminutes", 75);
  const unsubscribe_maxminutes = ls_maxminutes.subscribe((value) => {
    ls_maxminutes_val = value || 75;
  });
  let maxminutes = ls_maxminutes_val;

  let ls_items_val = 6;
  const ls_items = writable("ls_items", 6);
  const unsubscribe_items = ls_items.subscribe((value) => {
    ls_items_val = value || 6;
  });
  let items = ls_items_val;

  let timers = [];
  let editingTimer = null;
  let modalTimer = null;
  $: modalTimer = editingTimer !== null ? timers.find(t => t.tid === editingTimer) : null;

  const ls_timers = writable("ls_timers", []);
  const unsubscribe_timers = ls_timers.subscribe((value) => {
    if (Array.isArray(value)) {
      timers = value;
    } else if (value && typeof value === "object") {
      timers = Object.values(value);
    } else {
      timers = [];
    }
    // Fixed: Use requestAnimationFrame instead of setTimeout(0)
    requestAnimationFrame(() => {
      try {
        TimeInfo();
      } catch (e) {
        console.error("TimeInfo error:", e);
      }
    });
  });

  function alertvoice(id) {
    const text = "Timer " + id + ", sudah habis waktu";

    // Try Native Web Speech API first (Offline & Native)
    if ("speechSynthesis" in window) {
      // Cancel any currently playing speech to avoid queue buildup
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID"; // Indonesian
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Fallback voice selection if needed
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.length > 0
        ? voices.find((v) => v.lang.includes("id"))
        : null;
      if (idVoice) utterance.voice = idVoice;

      window.speechSynthesis.speak(utterance);
    }
    // Fallback to responsiveVoice if native API fails/missing
    else if (typeof responsiveVoice !== "undefined") {
      responsiveVoice.speak(text, "Indonesian Female", {
        pitch: 1,
        rate: 1,
        volume: 1,
      });
    }
  }

  function diff_minutes(date_now, date_future) {
    if (date_now > date_future) {
      return { m: 0, s: 0 };
    }

    var delta = Math.abs(date_future - date_now) / 1000;

    var days = Math.floor(delta / 86400);
    delta -= days * 86400;

    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    var seconds = Math.floor(delta % 60);

    var dif = Math.floor((date_future - date_now) / 60000);

    return { m: dif, s: seconds };
  }

  function countdown(element, minutes, seconds, _minuteadd) {
    var el = element;

    // Fixed: Added safety check
    var timerIntervalID = timers.filter(function (timer) {
      return timer.tid == el.id;
    });

    if (!timerIntervalID || timerIntervalID.length === 0) {
      console.error("Timer not found for id:", el.id);
      return;
    }

    // Check if timer is already done - don't restart countdown
    if (timerIntervalID[0]["done"]) {
      if (el.parentElement) {
        el.parentElement.innerHTML = "Time's Up";
      }
      return; // Exit early, don't set up interval
    }

    let date_now = new Date();
    let date_future = new Date(timerIntervalID[0]["finish_full"]);

    let delta_time = diff_minutes(date_now, date_future);

    minutes = delta_time.m;
    seconds = delta_time.s;

    // Fixed: Clear existing interval if any
    if (timerIntervalID[0]["timercontrol"]) {
      clearInterval(timerIntervalID[0]["timercontrol"]);
    }

    timerIntervalID[0]["timercontrol"] = setInterval(function () {
      // Recalculate remaining time to prevent drift and sync with summary
      let now = new Date();
      // Ensure finish_full is a Date object (might be string from JSON)
      let future = new Date(timerIntervalID[0]["finish_full"]);

      let diff = diff_minutes(now, future);
      minutes = diff.m;
      seconds = diff.s;

      if (minutes <= 0 && seconds <= 0) {
        // Check again if timer is already done (prevent duplicate triggers)
        const currentTimer = timers.find((t) => t.tid == el.id);
        if (currentTimer && currentTimer.done) {
          clearInterval(timerIntervalID[0]["timercontrol"]);
          return; // Already processed, exit
        }

        // Timer finished - scroll to card and mark as done
        let cardElement = document.getElementById("card-" + el.id);
        if (cardElement) {
          // Add flash animation
          cardElement.classList.add("flash-animation");
          // Scroll to card with offset for sticky header
          scrollToElementWithOffset(cardElement, SCROLL_OFFSET_PX);
          // Add error state after animation completes (1.8s = 0.6s * 3 pulses)
          setTimeout(() => {
            cardElement.className += " error card-off ";
            // Remove flash animation class
            cardElement.classList.remove("flash-animation");
          }, 3000);
        }

        if (el.parentElement) {
          el.parentElement.innerHTML = "Time's Up";
        }

        clearInterval(timerIntervalID[0]["timercontrol"]);
        alertvoice(el.id);
        playBeep(); // Backup beep tone

        // Send system notification if allowed (Critical for screen lock)
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            // Mobile browsers often vibrate/sound on notification
            new Notification(`Timer ${el.id} Finished!`, {
              body: "Waktu sudah habis!",
              icon: "/favicon.png",
              requireInteraction: true,
              tag: `timer-${el.id}`,
              vibrate: [200, 100, 200],
            });
          } catch (e) {
            console.error("Notification failed", e);
          }
        }

        // Delay setting done=true until after animation completes
        // This prevents card from disappearing immediately in hide-completed mode
        const timerId = Number(el.id);
        setTimeout(() => {
          // Use immutable update for reactivity
          timers = timers.map((timer) =>
            timer.tid === timerId ? { ...timer, done: true } : timer,
          );
          ls_timers.set(timers);
        }, 3000); // Same duration as flash animation (5 pulses)
        TimeInfo();
        return;
      }

      if (minutes > 0) {
        var minute_text = minutes + (minutes > 1 ? " minutes" : " minute");
      } else {
        var minute_text = "";
      }
      var second_text = seconds > 1 ? "" : "";
      let timerun = document.getElementsByClassName("timer-" + el.id);
      let timertext = minute_text + " " + seconds + " " + second_text + "";
      for (let i = 0; i < timerun.length; i++) {
        timerun[i].innerHTML = timertext;
      }
    }, 1000);
  }
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
        return;
      }

      // Timer still running — start countdown
      const el = document.getElementById(String(timer.tid));
      if (el) {
        countdown(el, timer.maxminute, 0);
      }
    });
    if (changed) {
      ls_timers.set(timers);
    }
  }
  function dynamicsort(property, order) {
    var sort_order = 1;
    if (order === "desc") {
      sort_order = -1;
    }
    return function (a, b) {
      if (a[property] < b[property]) {
        return -1 * sort_order;
      } else if (a[property] > b[property]) {
        return 1 * sort_order;
      } else {
        return 0 * sort_order;
      }
    };
  }
  /**
   * Update timer summary information (active count, first start, early/last finish)
   * Called whenever timer state changes
   */
  function TimeInfo() {
    // Reset all summary values
    timeractive = "-";
    timerdone = "-";
    firststart = "-";
    lastfinish = "-";
    earlyfinish = "-";
    // Early return if no timers
    if (!timers || timers.length === 0) {
      return;
    }
    // Get active timers (not removed and not done)
    const activeTimers = timers.filter((timer) => !timer.remove && !timer.done);

    // Get completed timers (not removed and done)
    const completedTimers = timers.filter(
      (timer) => !timer.remove && timer.done,
    );

    // Set timer counts
    timeractive = activeTimers.length;
    timerdone = completedTimers.length;

    // Update summary based on available timers
    if (activeTimers.length > 0) {
      updateSummaryInfo(activeTimers);
    } else if (completedTimers.length > 0) {
      // Use completed timers for summary if no active ones
      updateSummaryInfo(completedTimers);
    }
    // Auto-cleanup: if all timers are removed, reset everything
    const removedTimers = timers.filter((timer) => timer.remove);
    if (timers.length === removedTimers.length && timers.length > 0) {
      count = 1;
      timers = [];
      ls_count.set(count);
      ls_timers.set(timers);
    }

    // Initialize sticky header reference
    if (!header) {
      header = document.getElementById("summary");
      if (header) {
        sticky = header.offsetTop;
      }
    }
  }
  /**
   * Update summary information (first start, early finish, last finish)
   * @param {Array} timerList - List of timers to analyze
   */
  function updateSummaryInfo(timerList) {
    if (!timerList || timerList.length === 0) {
      return;
    }
    // Helper function to format finish time with countdown if < 1 minute
    function formatFinishTime(timer) {
      const now = new Date();
      const finishTime = new Date(timer.finish_full);
      const diffMs = finishTime - now;
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffSeconds = Math.floor((diffMs % 60000) / 1000);
      // If less than 1 minute remaining, show seconds
      if (diffMinutes < 1 && diffSeconds > 0 && !timer.done) {
        return `${timer.finish_at} (${timer.text}) - ${diffSeconds}s left`;
      }
      return `${timer.finish_at} (${timer.text})`;
    }
    // Helper to get timestamp safely
    const getTime = (t) => {
      const d = t instanceof Date ? t : new Date(t);
      return d.getTime();
    };

    // Sort by start time (ascending) - immutable
    const sortedByStart = [...timerList].sort(
      (a, b) => getTime(a.start_full) - getTime(b.start_full),
    );
    // Sort by finish time (ascending) - immutable
    const sortedByFinish = [...timerList].sort(
      (a, b) => getTime(a.finish_full) - getTime(b.finish_full),
    );
    // First start: earliest start time
    const firstTimer = sortedByStart[0];
    firststart = `${firstTimer.start_at} (${firstTimer.text})`;
    // Early finish: earliest finish time (with seconds if < 1 min)
    const earlyTimer = sortedByFinish[0];
    earlyfinish = formatFinishTime(earlyTimer);
    // Last finish: latest finish time (with seconds if < 1 min)
    const lastTimer = sortedByFinish[sortedByFinish.length - 1];
    lastfinish = formatFinishTime(lastTimer);
  }
  function addTimer({ maxminutes, items, note }) {
    ls_maxminutes.set(maxminutes);
    let xstart_at = new Date();
    let xfinish_at = new Date(xstart_at.getTime() + maxminutes * 60000);
    let xstart =
      (xstart_at.getHours() < 10 ? "0" + xstart_at.getHours() : xstart_at.getHours()) +
      ":" +
      (xstart_at.getMinutes() < 10
        ? "0" + xstart_at.getMinutes()
        : xstart_at.getMinutes()) +
      ":" +
      (xstart_at.getSeconds() < 10
        ? "0" + xstart_at.getSeconds()
        : xstart_at.getSeconds());
    let xfinish =
      (xfinish_at.getHours() < 10
        ? "0" + xfinish_at.getHours()
        : xfinish_at.getHours()) +
      ":" +
      (xfinish_at.getMinutes() < 10
        ? "0" + xfinish_at.getMinutes()
        : xfinish_at.getMinutes()) +
      ":" +
      (xfinish_at.getSeconds() < 10
        ? "0" + xfinish_at.getSeconds()
        : xfinish_at.getSeconds());
    timers = timers.concat({
      tid: count,
      remove: false,
      text: "Timer " + count,
      start_at: xstart,
      finish_at: xfinish,
      maxminute: maxminutes,
      items: items,
      start_full: xstart_at,
      finish_full: xfinish_at,
      done: false,
      note: note || "",
    });
    ls_timers.set(timers);
    count += 1;
    ls_count.set(count);
    TimeInfo();
  }

  function deleteTimer(timerId) {
    var timerIntervalID = timers.filter(function (timer) {
      return timer.tid == timerId;
    });
    if (timerIntervalID.length === 0) {
      console.error("Timer not found");
      return;
    }
    if (confirm("Hapus Timer " + timerId + "?")) {
      clearInterval(timerIntervalID[0]["timercontrol"]);
      timers = timers.map((timer) =>
        timer.tid === timerId ? { ...timer, remove: true } : timer,
      );
      ls_timers.set(timers);
      TimeInfo();
    }
  }
  function deleteAllTimers() {
    if (timers.length === 0) {
      alert("Tidak ada timer untuk dihapus");
      return;
    }
    if (
      confirm(
        "Hapus semua " + timers.length + " timer? Ini tidak bisa dibatalkan.",
      )
    ) {
      // Clear all intervals before removing
      timers.forEach((timer) => {
        if (timer.timercontrol) {
          clearInterval(timer.timercontrol);
        }
      });

      // Reset state
      timers = [];
      count = 1;
      ls_timers.set(timers);
      ls_count.set(count);
      TimeInfo();
    }
  }
  function toggleHideCompleted() {
    hideCompletedTimers = !hideCompletedTimers;
    ls_hideCompleted.set(hideCompletedTimers); // Persist to localStorage
  }
  function startEditTimer(timerId) {
    const timer = timers.find((t) => t.tid === timerId);
    if (timer && !timer.done) {
      editingTimer = timerId;
    }
  }
  function cancelEdit() {
    editingTimer = null;
  }

  function handleModalSave(event) {
    const { timerId, minutes, items, note } = event.detail;
    const timerIndex = timers.findIndex((t) => t.tid === timerId);
    if (timerIndex === -1) return;
    const timer = timers[timerIndex];

    let now = new Date();
    let xfinish_at = new Date(now.getTime() + minutes * 60000);

    if (timer.timercontrol) {
      clearInterval(timer.timercontrol);
    }

    let xfinish =
      (xfinish_at.getHours() < 10 ? "0" + xfinish_at.getHours() : xfinish_at.getHours()) +
      ":" +
      (xfinish_at.getMinutes() < 10 ? "0" + xfinish_at.getMinutes() : xfinish_at.getMinutes()) +
      ":" +
      (xfinish_at.getSeconds() < 10 ? "0" + xfinish_at.getSeconds() : xfinish_at.getSeconds());

    timers[timerIndex] = {
      ...timer,
      maxminute: minutes,
      items: items,
      note: note,
      finish_at: xfinish,
      finish_full: xfinish_at,
      done: false,
    };

    ls_timers.set(timers);
    TimeInfo();
    editingTimer = null;

    setTimeout(() => {
      const element = document.getElementById(timerId.toString());
      if (element) {
        countdown(element, minutes, 0);
      }
    }, 100);
  }
  function isDarkMode() {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.documentElement.style.setProperty("--back-color", "#212529");
      document.documentElement.style.setProperty("--fore-color", "#6c757d");
      document.documentElement.style.setProperty(
        "--card-back-color",
        "#31383e",
      );
      document.documentElement.style.setProperty(
        "--card-fore-color",
        "#6c757d",
      );
      document.documentElement.style.setProperty(
        "--card-border-color",
        "#464f57",
      );
      document.documentElement.style.setProperty(
        "--footer-back-color",
        "#212529",
      );
      document.documentElement.style.setProperty(
        "--footer-border-color",
        "#464f57",
      );
      document.documentElement.style.setProperty("--sticky-shadow", "#ccc");
    }
  }
  // Fixed: Call isDarkMode on mount
  if (typeof window !== "undefined") {
    isDarkMode();
  }
  // Fixed: Proper scroll handler with height check and debouncing
  if (typeof window !== "undefined") {
    window.onscroll = debounce(function () {
      if (header && typeof sticky !== "undefined") {
        const containerd = document.getElementsByClassName("containerd");
        // Check if summary takes too much space (more than 40% of viewport)
        const summaryHeight = header.offsetHeight;
        const viewportHeight = window.innerHeight;
        const summaryRatio = summaryHeight / viewportHeight;
        // Only make sticky if summary is less than threshold of viewport height
        if (summaryRatio < STICKY_THRESHOLD && window.pageYOffset > sticky) {
          header.classList.add("sticky");
          if (containerd[0]) {
            containerd[0].classList.add("sticky-containerd");
          }
        } else {
          header.classList.remove("sticky");
          if (containerd[0]) {
            containerd[0].classList.remove("sticky-containerd");
          }
        }
      }
    }, SCROLL_DEBOUNCE_MS);
  }

  onMount(() => {
    // Kick off async voice loading so getVoices() returns results later
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }

    // Start all active timer countdowns after DOM is fully rendered
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

  afterUpdate(() => {
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

  onDestroy(() => {
    if (summaryInterval) clearInterval(summaryInterval);
    // Cleanup all timer intervals
    timers.forEach((timer) => {
      if (timer.timercontrol) {
        clearInterval(timer.timercontrol);
      }
    });
    // Unsubscribe from stores
    unsubscribe_count();
    unsubscribe_maxminutes();
    unsubscribe_items();
    unsubscribe_timers();
    unsubscribe_hideCompleted();
    // Remove scroll listener
    if (typeof window !== "undefined") {
      window.onscroll = null;
    }
  });
</script>

<svelte:head>
  <title>::Donut Timer::</title>
  <meta name="description" content="multi timer countdown apps" />
  <meta
    name="keywords"
    content="multi timer, countdown, donut, kitchen, timer, parallel timer"
  />
  <meta name="author" content="amdersz5g7" />
  <meta name="robots" content="index, nofollow" />
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/mini.css/3.0.1/mini-default.min.css"
  />
  <script
    src="https://code.responsivevoice.org/responsivevoice.js?key=rrTffgeB"
  ></script>
  <script async src="scripts/gtag.js"></script>
  <!-- Google Tag Manager -->
  <script>
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", "GTM-MSNW3DF");
  </script>
  <!-- End Google Tag Manager -->
</svelte:head>
<main>
  <!-- Google Tag Manager (noscript) -->
  <noscript
    ><iframe
      title="gtag"
      src="https://www.googletagmanager.com/ns.html?id=GTM-MSNW3DF"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
    ></iframe></noscript
  >
  <!-- End Google Tag Manager (noscript) -->
  <h1>Donut Timer</h1>
</main>

<centerx>
  <div id="summary" class="containerx">
    <TimerForm
      bind:maxminutes
      bind:items
      {addTimer}
    />

    <div id="summaryx">
      <TimerSummary
        {firststart}
        {lastfinish}
        {earlyfinish}
        {timeractive}
        {timerdone}
        {count}
      />
    </div>
  </div>
</centerx>
<div class="containerd">
  <div class="row">
    {#each timers as timer}
      {#if !timer.remove && !(hideCompletedTimers && timer.done)}
        <div
          id={"card-" + timer.tid}
          class="col-md-2 col-sm-6 col-xs-12"
          style="margin-bottom: 20px;"
        >
          <div class="card fluid">
            <div
              class="section"
              style="position: relative; display: flex; align-items: center; justify-content: space-between;"
            >
              <h4 style="margin: 0;">Timer {timer.tid}</h4>
              <button
                class="xprimary secondary"
                on:click={() => deleteTimer(timer.tid)}
                style="margin: 0;"
                aria-label="Delete timer {timer.tid}"
              >
                <Trash2Icon size="16" />
              </button>
            </div>
            <div class="section" style="position: relative; padding-right: 48px; min-height: 40px;">
              <div>
                <TargetIcon size="20" />
                <span class="justinfo">{timer.maxminute} menit</span>
              </div>
              <div>
                <PackageIcon size="20" />
                <span class="justinfo">{timer.items} items</span>
              </div>
              <div>
                <ClockIcon size="20" />
                <span class="justinfo">{timer.start_at}</span>
              </div>
              <div>
                <StopCircleIcon size="20" />
                <span class="justinfo">{timer.finish_at}</span>
              </div>
              {#if timer.note}
                <div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; color: #888;">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                  <span class="justinfo" style="color: #888; font-style: italic;">
                    {timer.note.length > 40 ? timer.note.slice(0, 40) + '...' : timer.note}
                  </span>
                </div>
              {/if}
              {#if !timer.done}
                <button
                  class="xprimary secondary edit-timer-btn"
                  on:click={() => startEditTimer(timer.tid)}
                  style="margin: 0; position: absolute; bottom: 8px; right: 8px;"
                  aria-label="Edit timer {timer.tid}"
                >
                  <EditIcon size="16" />
                </button>
              {/if}
            </div>
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
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>

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

{#if count > 1}
  <div class="row">
    <div class="col-sm-6 col-md-6 col-lg-6">
      <button
        on:click={toggleHideCompleted}
        class="xprimary {hideCompletedTimers
          ? 'secondary'
          : 'toggle-show-btn'} shadowed"
        style="width: 100%; margin: 0"
        aria-label="{hideCompletedTimers ? 'Show' : 'Hide'} completed timers"
      >
        <span style="position: relative; top: 3px;padding-right: 5px;">
          {#if hideCompletedTimers}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          {:else}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              ></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          {/if}
        </span>
        <span>{hideCompletedTimers ? "Show" : "Hide"} Completed</span>
      </button>
    </div>
    <div class="col-sm-6 col-md-6 col-lg-6">
      <button
        on:click={deleteAllTimers}
        class="xprimary secondary shadowed"
        style="width: 100%; margin: 0"
        aria-label="Delete all timers"
      >
        <span style="position: relative; top: 3px;padding-right: 5px;"
          ><Trash2Icon size="20" /></span
        ><span>Delete All</span>
      </button>
    </div>
  </div>
{/if}
<footer style="margin-top: 20px;">
  <center>
    <div class="row">
      <div class="col-sm-12">
        <a href="https://www.svelte.dev">
          <img src="/svelte.png" style="height: 48px" alt="svelte" />
        </a>
        <a href="https://github.com/amdersz5g7/donut-timer">
          <img
            style="height: 48px"
            src="https://cdn3.iconfinder.com/data/icons/social-media-2034/500/github-64.png"
            alt="Host on Github"
          />
        </a>
        <a href="https://www.netlify.com">
          <img
            style="height: 48px"
            src="https://www.netlify.com/img/global/badges/netlify-color-accent.svg"
            alt="Deploys by Netlify"
          />
        </a>
      </div>
      <div class="col-sm-12">v25.11</div>
    </div>
  </center>
</footer>

<style>
  .card.card-off > div * {
    color: #eca4a4;
    text-decoration: line-through;
  }
  html,
  body {
    overscroll-behavior-y: contain;
  }
  .remove_timer {
    display: none;
  }
  main {
    color: yellowgreen;
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
  .to-center {
    text-align: center;
  }
  .justinfo {
    position: relative;
    top: -4px;
    left: 3px;
    word-break: break-word;
  }
  .xprimary {
    margin-top: 3px;
  }
  /* Toggle show completed button - green color */
  .card.fluid .toggle-show-btn {
    background: #43a047; /* Material Green 600 */
    color: white;
    border: 1px solid #388e3c;
  }
  .card.fluid .toggle-show-btn:hover {
    background: #388e3c; /* Material Green 700 */
    border-color: #2e7d32;
  }
  .card.fluid .toggle-show-btn:active {
    background: #2e7d32; /* Material Green 800 */
  }
  /* Center icons in icon-only buttons — increase specificity to override mini.css */
  button.xprimary.secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 3px;
  }
  .edit-section {
    background: rgba(0, 0, 0, 0.05);
    padding: 15px;
    border-radius: 8px;
  }
  .card.fluid .edit-timer-btn {
    background: #f57c00; /* Material Orange 700 - Good contrast */
    color: white;
    border: 1px solid #ef6c00;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .card.fluid .edit-timer-btn:hover {
    background: #ef6c00; /* Material Orange 800 */
    border-color: #e65100;
  }
  .card.fluid .edit-timer-btn:active {
    background: #e65100; /* Material Orange 900 */
  }
  @media (prefers-color-scheme: dark) {
    .card.fluid .edit-timer-btn {
      background: #fb8c00; /* Lighter orange for dark mode */
      border-color: #f57c00;
    }
    .card.fluid .edit-timer-btn:hover {
      background: #f57c00;
      border-color: #ef6c00;
    }
    .card.fluid .edit-timer-btn:active {
      background: #ef6c00;
    }
  }
  #input_menit,
  #input_items {
    width: 100%;
  }
  .sticky {
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1;
    background: var(--back-color);
    box-shadow: 0 10px 10px -5px var(--sticky-shadow);
    left: 0;
  }
  .sticky-containerd {
    padding-top: 178px;
  }
  /* Flash animation for timer finish */
  @keyframes flashPulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
      transform: scale(1);
    }
    25% {
      box-shadow: 0 0 20px 5px rgba(244, 67, 54, 0.8);
      transform: scale(1.02);
    }
    50% {
      box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
      transform: scale(1);
    }
  }
  .flash-animation {
    animation: flashPulse 0.6s ease-in-out 5;
  }
  :root {
    --sticky-shadow: #212529;
  }
</style>
