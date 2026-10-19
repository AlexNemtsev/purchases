<script lang="ts">
  import TrashIcon from '@lucide/svelte/icons/trash';

  import * as Card from '$lib/components/ui/card';
  import * as ContextMenu from '$lib/components/ui/context-menu';

  interface Props {
    title: string;
    comment?: string;
    onContextClick: () => void;
    onDelete: () => void;
  }

  let { title, comment, onContextClick, onDelete }: Props = $props();
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger onclick={onContextClick}>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-lg">{title}</Card.Title>
        {#if comment}<Card.Description>{comment}</Card.Description>{/if}
      </Card.Header>
    </Card.Root>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item variant="destructive" onclick={onDelete}>
      <TrashIcon />
      Удалить
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>
