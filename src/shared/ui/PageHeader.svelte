<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import type { Snippet } from 'svelte';

  import { Button } from '$lib/components/ui/button';

  interface Props {
    backHref?: string;
    backLabel?: string;
    children?: Snippet;
  }

  let { backHref, backLabel = 'Назад', children }: Props = $props();
</script>

<div class="relative flex flex-row items-center justify-center">
  {#if backHref}
    <Button
      href={backHref}
      variant="ghost"
      size="icon-lg"
      class="absolute left-0"
      aria-label={backLabel}
    >
      <ArrowLeftIcon />
    </Button>
  {/if}
  <h1 class="px-12 text-center text-3xl">
    {@render children?.()}
  </h1>
</div>
