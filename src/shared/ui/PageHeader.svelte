<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<h1 class="col-start-2 text-3xl">
  {#if children}
    {@render children()}
  {/if}
</h1>
