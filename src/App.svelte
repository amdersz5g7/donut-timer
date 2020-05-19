<svelte:head>
  <title>::Donut Timer::</title>
  
  <meta name="description" content="multi timer countdown apps" />
  <meta name="keywords" content="multi timer, countdown, donut" />
  <meta name="author" content="amdersz5g7" />
  <meta name="robots" content="index, nofollow" />

  <link rel="stylesheet" href="https://cdn.rawgit.com/Chalarangelo/mini.css/v3.0.1/dist/mini-default.min.css" />

  <script src="https://code.responsivevoice.org/responsivevoice.js?key=rrTffgeB"></script>

</svelte:head>

<script>
  import { PlusCircleIcon, PlusSquareIcon, ChevronsDownIcon, StopCircleIcon, CheckCircleIcon, ClockIcon, TargetIcon, Trash2Icon } from 'svelte-feather-icons'

  let count = 1;
  let maxminutes = 40;
  let timers = [];
  let hours, minutes, seconds;

  function alertvoice(id){
   responsiveVoice.speak(
    "Timer ke " + id + ', sudah habis waktu',
    "Indonesian Female",
    {
     pitch: 1, 
     rate: 1, 
     volume: 1
    }
   );
  }

  function countdown(element, minutes, seconds) {
    // Fetch the display element
    var el = element; //document.getElementById(element);

    var timerIntervalID = timers.filter(function(timer){
      return timer.tid == el.id
    });

    timerIntervalID[0]['timercontrol'] = setInterval(function() {

    // Set the timer
      //var interval = setInterval(function() {

        if(seconds == 0) {
          if(minutes == 0) {
            let elparent = el.parentNode.parentNode;
            elparent.classList.add('error')
            el.parentNode.remove();

            //clearInterval(interval);
            clearInterval(timerIntervalID[0]['timercontrol']);
            alertvoice(el.id);
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
        el.innerHTML = minute_text + ' ' + seconds + ' ' + second_text + '';
        seconds--;
    }, 1000);
  }

  function countdwn(node){
    countdown(node,maxminutes,0)
  }

  function addTimer(){
    if (!maxminutes || maxminutes < 1){
      alert('max minutes harus lebih besar dari 0');
      return
    }

    let xstart_at = new Date();
    let xfinish = new Date(xstart_at.getTime() + (maxminutes*60000))
    let xstart = xstart_at;
    
    xstart = (xstart.getHours()<10 ? '0' + xstart.getHours():xstart.getHours())
      + ':' + (xstart.getMinutes() < 10 ? '0' + xstart.getMinutes():xstart.getMinutes()) 
      + ':' + (xstart.getSeconds() < 10 ? '0' + xstart.getSeconds():xstart.getSeconds());
    
    xfinish = (xfinish.getHours()<10 ? '0' + xfinish.getHours():xfinish.getHours())
      + ':' + (xfinish.getMinutes()<10 ? '0' + xfinish.getMinutes():xfinish.getMinutes())
      + ':' + (xfinish.getSeconds()<10 ? '0' + xfinish.getSeconds():xfinish.getSeconds());

    timers = timers.concat({
      tid: count, 
      done: false, 
      text: 'Timer ke-' + count, 
      start_at: xstart, 
      finish_at: xfinish,
      maxminute: maxminutes
    })
    count += 1;
  }

  function rmv(){
    let idtimer = this.parentNode.innerText.replace('Timer ke-','');
    var timerIntervalID = timers.filter(function(timer){
      return timer.tid == idtimer
    });

    if (confirm("Hapus " + this.parentNode.innerText + "?")){
      clearInterval(timerIntervalID[0]['timercontrol']);
      this.parentNode.parentNode.remove();
    }
  }
</script>

<main>
	<h1>Donut Timer</h1>
</main>

<centerx>
  <div class="container">
    <div class="row">
      <div class="col-sm">
        <input type="number" id="input_menit" placeholder="minutes" bind:value={maxminutes} />
      
        <button on:click={addTimer} class="xprimary">
          <PlusCircleIcon size="30" />
        </button>

      </div>
    </div>
  </div>
</centerx>

<div class="row">
{#each timers as timer}
  <div class="card fluid">
    <div class="section">
      <h4>Timer ke-{timer.tid}</h4>
      <button class="xprimary rmv" on:click={rmv}>
        <Trash2Icon size="16" />
      </button>
    </div>

    <div class="section">
      <div>
        <TargetIcon size="20" /> <span class="justinfo">{timer.maxminute} menit</span>
      </div>
      <div>
        <ClockIcon size="20" /> <span class="justinfo">{timer.start_at}</span>
      </div>
      <div>
        <StopCircleIcon size="20" /> <span class="justinfo">{timer.finish_at}</span>
      </div>
    </div>

    <div class="section to-center">
      <mark id={timer.tid} use:countdwn></mark>
    </div>
  </div>
{/each}
</div>
  

<footer>
  <center style="color: gray">
    <p>V8.C0d3 - 2020.05</p>
  </center>
</footer>


<style>
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

  .card.fluid{
    max-width: 100%;
    min-width: 44%;
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
    background: transparent;
    position: relative;
    left: -18px;
    top: 8px;
    border-radius: 50%;
  }
  .rmv{
    position: absolute;
    top: 4px;
    left: 75%;
  }
</style>
