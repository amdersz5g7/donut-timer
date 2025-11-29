<svelte:head>
  <title>::Donut Timer::</title>
  
  <meta name="description" content="multi timer countdown apps" />
  <meta name="keywords" content="multi timer, countdown, donut, kitchen, timer, parallel timer" />
  <meta name="author" content="amdersz5g7" />
  <meta name="robots" content="index, nofollow" />

  <link rel="stylesheet" href="https://cdn.rawgit.com/Chalarangelo/mini.css/v3.0.1/dist/mini-default.min.css" />

  <script src="https://code.responsivevoice.org/responsivevoice.js?key=rrTffgeB"></script>
  <script async src="scripts/gtag.js"></script>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-MSNW3DF');</script>
  <!-- End Google Tag Manager -->
</svelte:head>

<script>
  import { PlusCircleIcon, Trash2Icon, ClockIcon, TargetIcon, StopCircleIcon, PackageIcon, EditIcon, SaveIcon, XIcon } from 'svelte-feather-icons'
  import { writable } from './lib/persistent.js';    
  
  // Export prop to handle external props passed to component
  export let name = 'Donut Timer';
   
  let hours, minutes, seconds;
  let firststart = '-', lastfinish = '-', 
      timeractive = '-', earlyfinish = '-';
  let minuteadd = 0;
  let header, sticky;
  
  // Fixed: Proper initialization with fallback values
  let ls_count_val = 1;
  const ls_count = writable('ls_count', 1);  
  const unsubscribe_count = ls_count.subscribe(value => {    
    ls_count_val = value || 1;
  });
  let count = ls_count_val;
  
  let ls_maxminutes_val = 75;
  const ls_maxminutes = writable('ls_maxminutes', 75);  
  const unsubscribe_maxminutes = ls_maxminutes.subscribe(value => {    
    ls_maxminutes_val = value || 75;
  });
  let maxminutes = ls_maxminutes_val;
  
  let ls_items_val = 6;
  const ls_items = writable('ls_items', 6);  
  const unsubscribe_items = ls_items.subscribe(value => {    
    ls_items_val = value || 6;
  });
  let items = ls_items_val;
  
  let timers = [];
  let editingTimer = null; // Track which timer is being edited
  let editMinutes = 0;
  let editItems = 0;
  
  const ls_timers = writable('ls_timers', []);
  const unsubscribe_timers = ls_timers.subscribe(value => {
    if (Array.isArray(value)) {
      timers = value;
    } else if (value && typeof value === 'object') {
      timers = Object.values(value);
    } else {
      timers = [];
    }
    // Fixed: Use requestAnimationFrame instead of setTimeout(0)
    requestAnimationFrame(() => {
      try { 
        TimeInfo(); 
      } catch (e) { 
        console.error('TimeInfo error:', e);
      }
    });
  });
  
  function alertvoice(id){
    if (typeof responsiveVoice !== 'undefined') {
      responsiveVoice.speak(
        "Timer " + id + ', sudah habis waktu',
        "Indonesian Female",
        {
          pitch: 1, 
          rate: 1, 
          volume: 1
        }
      );
    }
  }

  function diff_minutes(date_now, date_future) {
    if (date_now > date_future){
      return {m: 0, s: 0}
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

    return {m: dif, s: seconds}
  }
 
  function countdown(element, minutes, seconds, _minuteadd) {
    var el = element;

    // Fixed: Added safety check
    var timerIntervalID = timers.filter(function(timer){
      return timer.tid == el.id
    });
    
    if (!timerIntervalID || timerIntervalID.length === 0) {
      console.error('Timer not found for id:', el.id);
      return;
    }
    
    let date_now = new Date();
    let date_future = new Date(timerIntervalID[0]['finish_full']);
    
    let delta_time = diff_minutes(date_now, date_future);
    
    minutes = delta_time.m; 
    seconds = delta_time.s;
    
    // Fixed: Clear existing interval if any
    if (timerIntervalID[0]['timercontrol']) {
      clearInterval(timerIntervalID[0]['timercontrol']);
    }
    
    timerIntervalID[0]['timercontrol'] = setInterval(function() {
      if(seconds == 0) {
        if(minutes == 0) {
          // Fixed: Added safety check for DOM element
          let cardElement = document.getElementById('card-' + el.id);
          if (cardElement) {
            cardElement.scrollIntoView();
            cardElement.className += ' error card-off ';
          }
          
          if (el.parentElement) {
            el.parentElement.innerHTML = "Time's Up";
          }

          clearInterval(timerIntervalID[0]['timercontrol']);
          alertvoice(el.id);
          
          timers.forEach(function(a, b) {
            if (a.tid == el.id){
              timers[b].done = true;
            }
          });
          
          // Fixed: Update store after modification
          ls_timers.set(timers);
          TimeInfo();

          return;
        } else {
          minutes--;
          seconds = 60;
        }
      }

      if(minutes > 0) {
        var minute_text = minutes + (minutes > 1 ? ' minutes' : ' minute');
      } else {
        var minute_text = '';
      }

      var second_text = seconds > 1 ? '' : '';
      let timerun = document.getElementsByClassName("timer-" + el.id);
      let timertext = minute_text + ' ' + seconds + ' ' + second_text + '';
      for (let i = 0; i < timerun.length; i++){
        timerun[i].innerHTML = timertext;
      }        
      seconds--;
    }, 1000);
  }

  function countdwn(node){
    countdown(node, maxminutes, 0);
  }

  function dynamicsort(property, order) {
    var sort_order = 1;
    if(order === "desc"){
      sort_order = -1;
    }
    return function (a, b){
      if(a[property] < b[property]){
        return -1 * sort_order;
      }else if(a[property] > b[property]){
        return 1 * sort_order;
      }else{
        return 0 * sort_order;
      }
    }
  }

  function TimeInfo(){
    timeractive = '-'; 
    firststart = '-'; 
    lastfinish = '-'; 
    earlyfinish = '-';

    if (!timers || timers.length == 0) {
      return;
    } 
    
    let timeractive_ = timers.filter(function(timer){
      return timer.remove == false && timer.done == false
    });
    timeractive = timeractive_.length;

    if (timeractive_.length == 0){
      timeractive = '-';
      timeractive_ = timers.filter(function(timer){
        return timer.remove == false && timer.done == true
      });
    }

    if (!!timeractive_ && timeractive_.length > 0){
      let ds = timeractive_.sort(dynamicsort('start_full', 'asc'));
      firststart = ds[0].start_at + ' (' + ds[0].text + ')';

      ds = timeractive_.sort(dynamicsort('finish_full', 'desc'));
      lastfinish = ds[0].finish_at + ' (' + ds[0].text + ')' + '<br /> <span class="timer-' + ds[0].tid + '"></span>';

      ds = timeractive_.sort(dynamicsort('finish_full', 'asc'));
      earlyfinish = ds[0].finish_at + ' (' + ds[0].text + ')' + '<br /> <span class="timer-' + ds[0].tid + '"></span>';
    } else {
      let timeremove = timers.filter(function(timer){
        return timer.remove == true
      });
      if (timers.length == timeremove.length){ 
        count = 1; 
        timers = []; 
        ls_count.set(count);
        ls_timers.set(timers);
      }
    }
    
    // Fixed: Moved sticky header logic to onMount
    if (!header) {
      header = document.getElementById("summary");
      if (header) {
        sticky = header.offsetTop;
      }
    }
  }

  function addTimer(){
    // Fixed: Better validation
    if (!maxminutes || maxminutes < 1 || !Number.isFinite(maxminutes)){
      alert('Menit harus lebih besar dari 0');
      return;
    }

    ls_maxminutes.set(maxminutes);
    
    let xstart_at = new Date();
    let xfinish_at = new Date(xstart_at.getTime() + (maxminutes * 60000));
    
    let xstart = xstart_at;
    let xfinish = xfinish_at;    
    
    xstart = (xstart.getHours() < 10 ? '0' + xstart.getHours() : xstart.getHours())
      + ':' + (xstart.getMinutes() < 10 ? '0' + xstart.getMinutes() : xstart.getMinutes()) 
      + ':' + (xstart.getSeconds() < 10 ? '0' + xstart.getSeconds() : xstart.getSeconds());
    
    xfinish = (xfinish.getHours() < 10 ? '0' + xfinish.getHours() : xfinish.getHours())
      + ':' + (xfinish.getMinutes() < 10 ? '0' + xfinish.getMinutes() : xfinish.getMinutes())
      + ':' + (xfinish.getSeconds() < 10 ? '0' + xfinish.getSeconds() : xfinish.getSeconds());

    timers = timers.concat({
      tid: count, 
      remove: false, 
      text: 'Timer ' + count, 
      start_at: xstart, 
      finish_at: xfinish,
      maxminute: maxminutes,
      items: items, // Save items value when timer is created
      start_full: xstart_at,
      finish_full: xfinish_at,
      done: false
    });
    
    ls_timers.set(timers);
    count += 1;
    ls_count.set(count);
    TimeInfo();
  }

  function deleteTimer(timerId) {
    var timerIntervalID = timers.filter(function(timer){
      return timer.tid == timerId
    });

    if (timerIntervalID.length === 0) {
      console.error('Timer not found');
      return;
    }

    if (confirm("Hapus Timer " + timerId + "?")){
      clearInterval(timerIntervalID[0]['timercontrol']);
        
      timers.forEach(function(a, b) {
        if (a.tid == timerId){
          timers[b].remove = true;
        }
      });
      
      ls_timers.set(timers);
      TimeInfo();
    }
  }

  function deleteAllTimers(){
    if (timers.length === 0){
      alert('Tidak ada timer untuk dihapus');
      return;
    }

    if (confirm("Hapus semua " + timers.length + " timer? Ini tidak bisa dibatalkan.")){
      timers.forEach(function(timer){
        if (timer.timercontrol){
          clearInterval(timer.timercontrol);
        }
      });
      
      timers = [];
      count = 1;
      ls_timers.set(timers);
      ls_count.set(count);
      TimeInfo();
    }
  }

  function startEditTimer(timerId) {
    const timer = timers.find(t => t.tid === timerId);
    if (timer && !timer.done) {
      editingTimer = timerId;
      editMinutes = timer.maxminute;
      editItems = timer.items;
    }
  }

  function cancelEdit() {
    editingTimer = null;
    editMinutes = 0;
    editItems = 0;
  }

  function saveEditTimer(timerId) {
    if (!editMinutes || editMinutes < 1 || !Number.isFinite(editMinutes)) {
      alert('Menit harus lebih besar dari 0');
      return;
    }

    if (!editItems || editItems < 1 || !Number.isInteger(editItems)) {
      alert('Items harus lebih besar dari 0');
      return;
    }

    const timerIndex = timers.findIndex(t => t.tid === timerId);
    if (timerIndex === -1) return;

    const timer = timers[timerIndex];
    
    // Keep original start time, only recalculate finish time
    // Convert to Date object if it's a string (from localStorage)
    let xstart_at = timer.start_full instanceof Date ? timer.start_full : new Date(timer.start_full);
    let xfinish_at = new Date(xstart_at.getTime() + (editMinutes * 60000));
    
    // Validate: finish time must be in the future
    let now = new Date();
    if (xfinish_at <= now) {
      alert('Waktu finish sudah lewat! Tambahkan lebih banyak menit.\n\nStart: ' + 
            xstart_at.toLocaleTimeString() + 
            '\nFinish akan jadi: ' + xfinish_at.toLocaleTimeString() + 
            '\nSekarang: ' + now.toLocaleTimeString());
      return;
    }
    
    // Clear existing interval
    if (timer.timercontrol) {
      clearInterval(timer.timercontrol);
    }

    // Format finish time only
    let xfinish = (xfinish_at.getHours() < 10 ? '0' + xfinish_at.getHours() : xfinish_at.getHours())
      + ':' + (xfinish_at.getMinutes() < 10 ? '0' + xfinish_at.getMinutes() : xfinish_at.getMinutes())
      + ':' + (xfinish_at.getSeconds() < 10 ? '0' + xfinish_at.getSeconds() : xfinish_at.getSeconds());

    // Update timer (keep original start_at and start_full)
    timers[timerIndex] = {
      ...timer,
      maxminute: editMinutes,
      items: editItems,
      finish_at: xfinish,
      finish_full: xfinish_at,
      done: false
    };

    ls_timers.set(timers);
    TimeInfo();
    
    // Restart countdown with remaining time
    setTimeout(() => {
      const element = document.getElementById(timerId.toString());
      if (element) {
        countdown(element, editMinutes, 0);
      }
    }, 100);

    cancelEdit();
  }

  function isDarkMode() {    
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.documentElement.style.setProperty('--back-color', '#212529');
      document.documentElement.style.setProperty('--fore-color', '#6c757d');
      document.documentElement.style.setProperty('--card-back-color', '#31383e');
      document.documentElement.style.setProperty('--card-fore-color', '#6c757d');
      document.documentElement.style.setProperty('--card-border-color', '#464f57');
      document.documentElement.style.setProperty('--footer-back-color', '#212529');
      document.documentElement.style.setProperty('--footer-border-color', '#464f57');
      document.documentElement.style.setProperty('--sticky-shadow', '#ccc');
    }
  }
  
  // Fixed: Call isDarkMode on mount
  if (typeof window !== 'undefined') {
    isDarkMode();
  }
  
  // Fixed: Proper scroll handler with height check
  if (typeof window !== 'undefined') {
    window.onscroll = function() {
      if (header && typeof sticky !== 'undefined') {
        var containerd = document.getElementsByClassName("containerd");
        
        // Check if summary takes too much space (more than 40% of viewport)
        const summaryHeight = header.offsetHeight;
        const viewportHeight = window.innerHeight;
        const summaryRatio = summaryHeight / viewportHeight;
        
        // Only make sticky if summary is less than 40% of viewport height
        if (summaryRatio < 0.4 && window.pageYOffset > sticky) {
          header.classList.add("sticky");
          if (containerd[0]) {
            containerd[0].classList.add('sticky-containerd');
          }
        } else {
          header.classList.remove("sticky");
          if (containerd[0]) {
            containerd[0].classList.remove('sticky-containerd');
          }
        }
      }
    };
  }
</script>

<main>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe title="gtag" src="https://www.googletagmanager.com/ns.html?id=GTM-MSNW3DF"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->
  <h1>Donut Timer</h1>
</main>

<centerx>
  <div id="summary" class="containerx">
    <div class="row">
      <div class="col-sm-3" style="display: flex; flex-direction: column;">
        <label for="input_menit" style="margin-bottom: 0.25rem;"><small>Minutes</small></label>
        <input type="number" id="input_menit" placeholder="minutes" bind:value={maxminutes} style="margin: 0;" min="1" />
      </div>
      <div class="col-sm-3" style="display: flex; flex-direction: column;">
        <label for="input_items" style="margin-bottom: 0.25rem;"><small>Items</small></label>
        <input type="number" id="input_items" placeholder="items" bind:value={items} min="1" style="margin: 0;" on:change={() => {
          if (!Number.isInteger(items) || items < 1) {
            items = 6;
          }
          ls_items.set(items);
        }} />
      </div>
      <div class="col-sm-6" style="display: flex; align-items: flex-end; padding: 0 calc(var(--universal-padding) / 2);">
        <button on:click={addTimer} class="xprimary primary shadowed" style="width: 100%; margin: 0; padding: 7px 0px;">
          <span style="position: relative; top: 3px;"><PlusCircleIcon size="20" /></span> <span>Add Timer</span>
        </button>
      </div>
    </div>

    <div id="summaryx">
    {#if count > 1 }
      <div class="row">
        <div class="col-sm-6">
          <h6><small>First Start</small>
          {firststart}
          </h6>
        </div>
        <div class="col-sm-6">
          <h6><small>Timer Active</small>
          {timeractive}
          </h6>
        </div>
      </div>

      <div class="row">
        <div class="col-sm-6">
          <h6><small>Early Finish</small>
          {@html earlyfinish}
          </h6>
        </div>
        <div class="col-sm-6">
          <h6><small>Last Finish</small>
          {@html lastfinish}
          </h6>
        </div>
      </div>
    {/if}
    </div>
  </div>
</centerx>

<div class="containerd">
<div class="row">
{#each timers as timer}
  {#if !timer.remove}
  <div id={'card-' + timer.tid} class="col-md-2 col-sm-6 col-xs-12" style="margin-bottom: 20px;">
    <div class="card fluid">
      <div class="section" style="position: relative; display: flex; align-items: center; justify-content: space-between;">
        <h4 style="margin: 0;">Timer {timer.tid}</h4>
        <button class="xprimary secondary" on:click={() => deleteTimer(timer.tid)} style="margin: 0; padding: 4px 8px;">
          <Trash2Icon size="16" />
        </button>
      </div>

      {#if editingTimer === timer.tid}
      <div class="section edit-section">
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <div style="flex: 1;">
            <label for="edit-minutes-{timer.tid}" style="display: block; margin-bottom: 4px;"><small>Minutes</small></label>
            <input 
              type="number" 
              id="edit-minutes-{timer.tid}"
              bind:value={editMinutes} 
              min="1"
              style="width: 100%; margin: 0;"
            />
          </div>
          <div style="flex: 1;">
            <label for="edit-items-{timer.tid}" style="display: block; margin-bottom: 4px;"><small>Items</small></label>
            <input 
              type="number" 
              id="edit-items-{timer.tid}"
              bind:value={editItems} 
              min="1"
              style="width: 100%; margin: 0;"
            />
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button 
            on:click={() => saveEditTimer(timer.tid)} 
            class="primary" 
            style="flex: 1; margin: 0; padding: 6px 0;">
            <span style="position: relative; top: 3px;"><SaveIcon size="16" /></span> Save
          </button>
          <button 
            on:click={cancelEdit} 
            class="secondary" 
            style="flex: 1; margin: 0; padding: 6px 0;">
            <span style="position: relative; top: 3px;"><XIcon size="16" /></span> Cancel
          </button>
        </div>
      </div>
      {:else}
      <div class="section">
        <div>
          <TargetIcon size="20" /> <span class="justinfo">{timer.maxminute} menit</span>
        </div>
        <div>
          <PackageIcon size="20" /> <span class="justinfo">{timer.items} items</span>
        </div>
        <div>
          <ClockIcon size="20" /> <span class="justinfo">{timer.start_at}</span>
        </div>
        <div>
          <StopCircleIcon size="20" /> <span class="justinfo">{timer.finish_at}</span>
        </div>
      </div>

      <div class="section to-center">
        <mark class="tertiary timer-{timer.tid}" id={timer.tid} use:countdwn></mark>
      </div>

      {#if !timer.done}
      <div class="section" style="padding-top: 0;">
        <button class="xprimary secondary" on:click={() => startEditTimer(timer.tid)} style="width: 100%; margin: 0; padding: 6px 0;">
          <span style="position: relative; top: 3px;"><EditIcon size="16" /></span> Edit Timer
        </button>
      </div>
      {/if}
      {/if}
    </div>
  </div>
  {/if}
{/each}
</div>
</div>

{#if count > 1 }
<div class="row">
  <div class="col-sm-12 col-md-12 col-lg-12">
    <button on:click={deleteAllTimers} class="xprimary secondary shadowed" style="width: 100%; margin: 0">
      <span style="position: relative; top: 3px;padding-right: 5px;"><Trash2Icon size="20" /></span><span>Delete All</span>
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
      <a href="https://www.github.com">
        <img style="height: 48px" src="https://cdn3.iconfinder.com/data/icons/social-media-2034/500/github-64.png" alt="Host on Github" />
      </a>
      <a href="https://www.netlify.com">
        <img style="height: 48px" src="https://www.netlify.com/img/global/badges/netlify-color-accent.svg" alt="Deploys by Netlify" />
      </a>
    </div>
    <div class="col-sm-12">
      v25.11
    </div>
  </div>
</center> 
</footer>

<style> 
  .card.card-off > div * {
    color: #eca4a4 !important;
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
  
  .to-center{
    text-align: center;
  }
  
  .justinfo{
    position: relative;
    top: -4px;
    left: 3px;
  }
  
  .xprimary {
    margin-top: 3px
  }

  .edit-section {
    background: rgba(0, 0, 0, 0.05);
    padding: 15px !important;
    border-radius: 8px;
  }
  
  #input_menit, #input_items{
    width: 100%;
  }
  
  .sticky{
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

  :root{
    --sticky-shadow: #212529
  }
</style>