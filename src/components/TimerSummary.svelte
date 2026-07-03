<script>
  export let firststart = "-";
  export let lastfinish = "-";
  export let earlyfinish = "-";
  export let timeractive = "-";
  export let timerdone = "-";
  export let count = 1;
</script>

{#if count > 1}
  <div class="row">
    <div class="col-sm-6">
      <h6>
        <small>Early Start</small>
        {firststart}
      </h6>
    </div>
    <div class="col-sm-6">
      <h6>
        <small>Timers</small>
        {#if timeractive === "-" && timerdone === "-"}
          -
        {:else if timeractive === 0 && timerdone > 0}
          {timerdone} done
        {:else if timeractive > 0 && timerdone === 0}
          {timeractive} active
        {:else}
          {timeractive} active, {timerdone} done
        {/if}
      </h6>
    </div>
  </div>
  <div class="row">
    <div class="col-sm-6">
      <h6>
        <small>Early Finish</small>
        {earlyfinish}
      </h6>
    </div>
    <div class="col-sm-6">
      <h6>
        <small>Last Finish</small>
        {lastfinish}
      </h6>
    </div>
  </div>
{/if}
