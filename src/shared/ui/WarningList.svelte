<script lang="ts">
  interface Props {
    warnings: readonly string[];
  }

  let { warnings }: Props = $props();
</script>

{#if warnings.length > 0}
  <ul
    class="flex flex-col gap-1 rounded-md border border-destructive/30
      bg-destructive/5 p-3 text-sm text-destructive"
  >
    {#each warnings as warning (warning)}
      <li>{warning}</li>
    {/each}
  </ul>
{/if}
