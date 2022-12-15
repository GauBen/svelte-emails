<script lang="ts">
  import Header from "$lib/Header.svelte";
  export let name: string;
</script>

<Header>Hello {name}!</Header>

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
