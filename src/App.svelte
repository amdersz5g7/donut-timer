<svelte:head>
    <link rel="stylesheet" href="https://cdn.rawgit.com/Chalarangelo/mini.css/v3.0.1/dist/mini-default.min.css">

  <script src="https://code.responsivevoice.org/responsivevoice.js?key=rrTffgeB"></script>

</svelte:head>

<script>
  import { timer } from 'rxjs'
  let tick = timer(100, 1000);

  export let name;
  let count = 1;
  let maxminutes = 40;
  let timers = [];
  let hours, minutes, seconds;
  //let xmaxmin = maxminutes * 60;
  //{done: false, text: 'Timer ke-'+count}


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
    console.log(element, minutes, seconds);

    // Fetch the display element
    var el = element; //document.getElementById(element);
    // Set the timer
    var interval = setInterval(function() {
        if(seconds == 0) {
            if(minutes == 0) {
                (el.innerHTML = "STOP!");
              clearInterval(interval);
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

  function cnd(node){
    //debugger;
    //console.log(node, name)
    //node.innerHTML = name;
    countdown(node,maxminutes,0)
    //return {
    //update(name){
    //  console.log('tid', name);
    //  countdown(node,10,0)
    //},
    //destroy(){
    //  console.log('destroy');
    //}

    //}

  }

  function addTimer(){
    if (maxminutes < 1){
      alert('max minutes belum diisi');
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
</script>

<main>
	<h1>Donut Timer</h1>
</main>

<center>
  <input type="number" id="input_menit" placeholder="minutes" bind:value={maxminutes} />
  <button on:click={addTimer} class="primary">
    <span class="icon-edit"></span> Add Timer 
  </button>
</center>

{#each timers as timer}
  <div class:done={timer.done}>
    timer ke-{timer.tid}<br>
    max minutes: {timer.maxminute}<br>
    start at: {timer.start_at}<br>
    finish at: {timer.finish_at}<br>

    <div id={timer.tid} use:cnd={name}>
    </div>
 
  </div>
  <hr>
{/each}


  <!--
<div class="container">
  <div class="row">
    <div class="col-sm">
Left {name}
    </div>

    <div class="col-sm">
Right
    </div>

  </div>
</div>
-->

<footer>
  <center>
  <p>V8.C0d3::2020</p>
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
</style>
