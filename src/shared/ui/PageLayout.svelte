<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import type { Snippet } from 'svelte';

  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import NavMenu from '@/shared/ui/NavMenu.svelte';

  interface Props {
    children?: Snippet;
    onAdd?: () => void;
    showNavigation?: boolean;
  }

  let { children, onAdd, showNavigation }: Props = $props();
</script>

<div class="flex h-full min-h-0 w-full flex-col gap-2">
  <div class="flex min-h-0 flex-1 flex-col justify-between gap-2 pb-2">
    <ScrollArea class="min-h-0 flex-1">
      <div class="flex h-max flex-col gap-2 p-1 pt-2">
        {@render children?.()}
      </div>
    </ScrollArea>
    {#if onAdd}
      <Button
        class="h-16 w-16 self-end rounded-full"
        variant="default"
        aria-label="Добавить"
        onclick={onAdd}
      >
        <PlusIcon class="size-6" />
      </Button>
    {/if}
  </div>
</div>

{#if showNavigation}
  <NavMenu />
{/if}
