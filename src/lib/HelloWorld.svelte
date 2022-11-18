<script lang="ts">
  export let name: string;
  export let buttons: Array<{ label: string; color: string }>;
</script>

<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-image width="100px" src="https://mjml.io/assets/img/logo-small.png" />
        <mj-divider border-color="#F45E43" />
        <mj-text font-size="20px" color="#F45E43" font-family="helvetica">Hello {name}</mj-text>
      </mj-column>
    </mj-section>
    <mj-section>
      {#each buttons as { label, color }}
        <mj-column>
          <mj-button font-family="Helvetica" background-color={color} color="#fff" href="#">
            {label}
          </mj-button>
        </mj-column>
      {/each}
    </mj-section>
  </mj-body>
</mjml>
