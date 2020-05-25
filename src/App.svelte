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
  let firststart = '-', lastfinish = '-', 
      timeractive = '-', earlyfinish = '-';
  let minuteadd = 0;

  
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

  function countdown(element, minutes, seconds, _minuteadd) {
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
            document.getElementById('card-' + el.id).scrollIntoView();
            
            let elparent = el.parentNode.parentNode;
            //elparent.classList.add(['error', 'card-off']);
            elparent.className += ' error card-off '
            
            //el.parentNode.remove();
            el.parentElement.innerHTML = "Time's Up";

            //clearInterval(interval);
            clearInterval(timerIntervalID[0]['timercontrol']);
            alertvoice(el.id);
            
            timers.forEach(function(a,b) {
              if (a.tid == el.id){
                timers[b].done = true;
                TimeInfo()
              }
            });

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
        //el.innerHTML = minute_text + ' ' + seconds + ' ' + second_text + '';
        let timerun = document.getElementsByClassName("timer-" + el.id);
        let timertext = minute_text + ' ' + seconds + ' ' + second_text + '';
        for (let i = 0; i < timerun.length; i++){
          timerun[i].innerHTML = timertext;
        }        
        seconds--;
        /*
        minutes += ((!!_minuteadd && _minuteadd > 0) ? _minuteadd:0);
        minuteadd = 0;
        */
    }, 1000);
  }

  function countdwn(node){
    //countdown(node,0,maxminutes)
    countdown(node,maxminutes,0)
  }

  /*
  https://www.educative.io/edpresso/how-to-sort-an-array-of-objects-in-javascript
  */
  function dynamicsort(property,order) {
    var sort_order = 1;
    if(order === "desc"){
        sort_order = -1;
    }
    return function (a, b){
        // a should come before b in the sorted order
        if(a[property] < b[property]){
                return -1 * sort_order;
        // a should come after b in the sorted order
        }else if(a[property] > b[property]){
                return 1 * sort_order;
        // a and b are the same
        }else{
                return 0 * sort_order;
        }
    }
}

  function TimeInfo(){
    timeractive = '-'; firststart = '-'; 
    lastfinish =  '-'; earlyfinish = '-';

    let timeractive_ = timers.filter(function(timer){
      return timer.remove == false && timer.done == false
    });
    timeractive = timeractive_.length;

    console.log('time info')
    if (timeractive_.length == 0){
      timeractive = '-';
      timeractive_ = timers.filter(function(timer){
        return timer.remove == false && timer.done == true
      });
    }

    if (!!timeractive_ && timeractive_.length > 0){
      let ds = timeractive_.sort(dynamicsort('start_full','asc'));
      console.log(ds);
      firststart = ds[0].start_at + ' (' + ds[0].text + ')';

      ds = timeractive_.sort(dynamicsort('finish_full','desc'));
      lastfinish = ds[0].finish_at + ' (' + ds[0].text + ')' + '<br /> <span class="timer-' + ds[0].tid + '"></span>';

      ds = timeractive_.sort(dynamicsort('finish_full','asc'));
      earlyfinish = ds[0].finish_at + ' (' + ds[0].text + ')' + '<br /> <span class="timer-' + ds[0].tid + '"></span>';

      
    } else {
      let timeremove = timers.filter(function(timer){
        return timer.remove == true
      });
      if (timers.length == timeremove.length){ count = 1; timers = [];}
    }
  }

  function addTimer(){
    if (!maxminutes || maxminutes < 1){
      alert('max minutes harus lebih besar dari 0');
      return
    }

    let xstart_at = new Date();
    let xfinish_at = new Date(xstart_at.getTime() + (maxminutes*60000));
    
    let xstart = xstart_at;
    let xfinish = xfinish_at;    
    
    xstart = (xstart.getHours()<10 ? '0' + xstart.getHours():xstart.getHours())
      + ':' + (xstart.getMinutes() < 10 ? '0' + xstart.getMinutes():xstart.getMinutes()) 
      + ':' + (xstart.getSeconds() < 10 ? '0' + xstart.getSeconds():xstart.getSeconds());
    
    xfinish = (xfinish.getHours()<10 ? '0' + xfinish.getHours():xfinish.getHours())
      + ':' + (xfinish.getMinutes()<10 ? '0' + xfinish.getMinutes():xfinish.getMinutes())
      + ':' + (xfinish.getSeconds()<10 ? '0' + xfinish.getSeconds():xfinish.getSeconds());

    timers = timers.concat({
      tid: count, 
      remove: false, 
      text: 'Timer ke-' + count, 
      start_at: xstart, 
      finish_at: xfinish,
      maxminute: maxminutes,
      start_full: xstart_at,
      finish_full: xfinish_at,
      done: false
    })
    count += 1;
    console.log(timers);
    TimeInfo();
  }

  function rmv(){
    let idtimer = this.parentNode.innerText.replace('Timer ke-','');
    var timerIntervalID = timers.filter(function(timer){
      return timer.tid == idtimer
    });
    console.log(timerIntervalID);

    if (confirm("Hapus " + this.parentNode.innerText + "?")){
      clearInterval(timerIntervalID[0]['timercontrol']);
      //this.parentNode.parentNode.remove();
        
      timers.forEach(function(a,b) {
        if (a.tid == idtimer){
          timers[b].remove = true;
          TimeInfo()
        }
      });

      //console.log(timers_rmv_arr, timers)
    }
  }
  /*
  function add_more(minadd){
    
    //let _minuteadd = prompt("Add more minutes?");
    let txt;
    if (minadd == null || minadd == "" || minadd < 1) {
      txt = "input not valid";
    } else {
      txt = "ok, you add more " + minadd + ' minute(s)';
      //minuteadd = minadd
    } 
    console.log(minadd)
  }
  */

 /* 
 https://nandovieira.com/supporting-dark-mode-in-web-content 
 https://davidwalsh.name/css-variables-javascript
 */
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
    }
  }
  isDarkMode();
</script>

<main>
	<h1>Donut Timer</h1>
</main>

<centerx>
  <div class="containerx">
    <div class="row">
      <div class="col-sm-7">
        <input type="number" id="input_menit" placeholder="minutes" bind:value={maxminutes} />
      </div>
      <div class="col-sm-5">
        <button on:click={addTimer} class="xprimary primary shadowed">
          <span style="position: relative; top: 3px;"><PlusCircleIcon size="20" /></span> <span>Add Timer</span>
        </button>
      </div>
    </div>
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



</centerx>

<div class="containerd">
<div class="row">
{#each timers as timer}
  <div id={'card-' + timer.tid} class="card fluid {timer.remove ? 'remove_timer':''}">
    <div class="section">
      <h4 style="margin-left: 0px;">Timer ke-{timer.tid}</h4>
      <button class="xprimary rmv {timer.remove ? '':'secondary'}" on:click={timer.remove ? null:rmv}>
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

      <!--
      <div>
      <label for="modal-control">add minute</label>

      <input type="checkbox" id="modal-control" class="modal">
      <div>
        <div class="card">
          <label for="modal-control" class="modal-close" ></label>
          <h3 class="section">Add more minutes...</h3>      
          <input id="txtminuteadd" type="number" placeholder="add more minutes"/>  
          <button class="primar" on:click={add_more('3')}>
            add minute(s)
          </button>    
        </div>
      </div>
    </div>
    -->
    </div>
    

    <div class="section to-center ">
      <mark class="tertiary timer-{timer.tid}" id={timer.tid} use:countdwn></mark>
    </div>
  </div>
{/each}
</div>
</div>

<footer>
  <center style="color: gray">
    <p>V8.C0d3 - 2020.05</p>
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
    /*background: transparent;
    position: relative;
    left: -18px;
    top: 8px;
    border-radius: 50%;
    margin: auto;
    */
    margin-top: 3px
  }
  .rmv{
    position: absolute;
    top: 6px;
    left: 67%;
  }
  #input_menit{
    width: 100%;
  }
 
</style>
