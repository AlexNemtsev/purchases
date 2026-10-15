<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="flex flex-row justify-center">
  <h1 class="text-3xl">
    {#if children}
      {@render children()}
    {/if}
  </h1>
</div>
