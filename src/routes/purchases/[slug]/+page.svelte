<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import Pencil from '@lucide/svelte/icons/pencil';

  import { Button } from '$lib/components/ui/button';
  import * as InputGroup from '$lib/components/ui/input-group';

  // import type { PageProps } from './$types';

  import { resolve } from '$app/paths';

  // let { params }: PageProps = $props();
  let title = $state('Озон');
  let isTitleEditing = $state(true);

  const handleTitleEdit = () => {
    isTitleEditing = true;
  };

  const onInputEnd = () => {
    isTitleEditing = false;
  };
</script>

<div class="grid w-full grid-cols-12 items-center justify-items-center gap-4">
  <a href={resolve('/purchases')}>
    <ChevronLeft class="size-9" />
  </a>
  {#if isTitleEditing}
    <InputGroup.Root class="col-start-2 col-end-13">
      <InputGroup.Input bind:value={title} onblur={onInputEnd} />
      <InputGroup.Addon align="inline-end">
        <Button variant="ghost" size="icon" onclick={onInputEnd}>
          <Check class="text-primary" />
        </Button>
      </InputGroup.Addon>
    </InputGroup.Root>
  {:else}
    <h1 class="col-start-2 col-end-12 text-3xl">{title}</h1>
    <Button variant="ghost" size="icon" onclick={handleTitleEdit}>
      <Pencil class="size-5 text-muted-foreground" />
    </Button>
  {/if}
</div>
