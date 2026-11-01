<script lang="ts">
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';

  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

  interface Action {
    label: string;
    onSelect: () => void;
    destructive?: boolean;
  }

  interface Props {
    label: string;
    actions: readonly Action[];
  }

  let { label, actions }: Props = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="icon-lg" aria-label={label}>
        <EllipsisIcon />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    {#each actions as action (action.label)}
      <DropdownMenu.Item
        variant={action.destructive ? 'destructive' : 'default'}
        onSelect={action.onSelect}
      >
        {action.label}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
