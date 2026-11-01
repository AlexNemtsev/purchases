<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import type { Category } from '@/entities/category';
  import { OperationCard, calculateOperationNet } from '@/entities/operation';
  import type { Operation, OperationRate } from '@/entities/operation';
  import ActionsMenu from '@/shared/ui/ActionsMenu.svelte';
  import EmptyState from '@/shared/ui/EmptyState.svelte';

  interface Props {
    operations: readonly Operation[];
    categories: readonly Category[];
    rate: OperationRate | null;
    onAddOperation: () => void;
    onEditOperation: (operation: Operation) => void;
    onDeleteOperation: (operation: Operation) => void;
  }

  let { operations, categories, rate, onAddOperation, onEditOperation, onDeleteOperation }: Props =
    $props();
</script>

<div class="flex flex-col gap-3">
  <div class="flex justify-end">
    <Button onclick={onAddOperation}>Добавить операцию</Button>
  </div>
  {#if operations.length === 0}
    <EmptyState title="Операций пока нет" description="Добавьте первую операцию в этот чек." />
  {:else}
    {#each operations as operation (operation.id)}
      {@const category = categories.find((entry) => entry.id === operation.categoryId)}
      <OperationCard
        {operation}
        categoryTitle={category?.title ?? 'Категория удалена'}
        categoryArchived={category?.archived ?? true}
        calculation={calculateOperationNet(operation, rate)}
      >
        {#snippet action()}
          <ActionsMenu
            label="Действия с операцией"
            actions={[
              { label: 'Изменить', onSelect: () => onEditOperation(operation) },
              { label: 'Удалить', destructive: true, onSelect: () => onDeleteOperation(operation) },
            ]}
          />
        {/snippet}
      </OperationCard>
    {/each}
  {/if}
</div>
