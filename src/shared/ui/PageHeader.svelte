<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="flex flex-row justify-center">
  <h1 class="text-3xl">
    {@render children?.()}
  </h1>
</div>
