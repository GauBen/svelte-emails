<script lang="ts">
  import Header from "$lib/Header.svelte";
  import { greet } from "./dep.js";
  export let name: string;
</script>

<Header>{greet(name)}</Header>

<mj-section>
  <mj-column>
    <mj-button
      color="#fff"
      background-color="#ff3e00"
      font-family="Helvetica"
      href="https://svelte.dev"
    >
      Learn Svelte
    </mj-button>
  </mj-column>
</mj-section>
