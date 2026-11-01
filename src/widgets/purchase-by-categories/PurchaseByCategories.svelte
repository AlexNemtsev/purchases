<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  import { CategoryBadge, calculateCategorySummary } from '../../entities/category';
  import type { Category } from '../../entities/category';
  import { OperationCard, calculateOperationNet } from '../../entities/operation';
  import type { Operation } from '../../entities/operation';
  import { calculateReceiptEffectiveRate } from '../../entities/receipt';
  import type { Receipt } from '../../entities/receipt';
  import { formatMoney } from '../../shared/lib/money';
  import EmptyState from '../../shared/ui/EmptyState.svelte';

  interface Props {
    operations: readonly Operation[];
    categories: readonly Category[];
    receiptsById: ReadonlyMap<string, Receipt>;
    onEditOperation: (operation: Operation) => void;
    onDeleteOperation: (operation: Operation) => void;
  }

  let { operations, categories, receiptsById, onEditOperation, onDeleteOperation }: Props =
    $props();
  const grouped = $derived(
    categories
      .map((category) => ({
        category,
        operations: operations.filter((operation) => operation.categoryId === category.id),
      }))
      .filter((group) => group.operations.length > 0)
  );
</script>

{#if operations.length === 0}
  <EmptyState
    title="Операций пока нет"
    description="Добавьте чек и операции, чтобы увидеть распределение по категориям."
  />
{:else}
  <div class="flex flex-col gap-3">
    {#each grouped as group (group.category.id)}
      {@const summary = calculateCategorySummary(group.operations, receiptsById)}
      <section class="flex flex-col gap-2 rounded-lg border p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <CategoryBadge category={group.category} />
          <p class="text-sm text-muted-foreground">
            Расходы: {formatMoney(summary.gross)} · Итого: {formatMoney(summary.net)}
          </p>
        </div>
        {#each group.operations as operation (operation.id)}
          {@const receipt = receiptsById.get(operation.receiptId)}
          {@const rate = receipt ? calculateReceiptEffectiveRate(receipt) : null}
          {@const calculation = calculateOperationNet(operation, rate)}
          <div class="flex flex-col gap-2 rounded-md bg-muted/30 p-2">
            <OperationCard
              {operation}
              categoryTitle={group.category.title}
              categoryArchived={group.category.archived}
              {calculation}
            />
            <div class="flex justify-end gap-2">
              <Button variant="outline" size="sm" onclick={() => onEditOperation(operation)}
                >Изменить</Button
              >
              <Button variant="destructive" size="sm" onclick={() => onDeleteOperation(operation)}
                >Удалить</Button
              >
            </div>
          </div>
        {/each}
      </section>
    {/each}
  </div>
{/if}
