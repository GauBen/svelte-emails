<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<h1>Svelte Email Previews</h1>
<ul>
  {#each data.mails as mail}
    <li><a href="./{mail}">{mail}</a></li>
  {/each}
</ul>

<style>
  h1,
  ul {
    font-family: system-ui;
  }
</style>
