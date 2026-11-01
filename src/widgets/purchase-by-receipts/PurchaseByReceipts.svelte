<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  import type { Category } from '../../entities/category';
  import { OperationCard, calculateOperationNet } from '../../entities/operation';
  import type { Operation } from '../../entities/operation';
  import { calculateReceiptSummary, ReceiptCard } from '../../entities/receipt';
  import type { Receipt } from '../../entities/receipt';
  import EmptyState from '../../shared/ui/EmptyState.svelte';

  interface Props {
    receipts: readonly Receipt[];
    operations: readonly Operation[];
    categories: readonly Category[];
    onAddReceipt: () => void;
    onEditReceipt: (receipt: Receipt) => void;
    onDeleteReceipt: (receipt: Receipt) => void;
    onAddOperation: (receiptId: string) => void;
    onEditOperation: (operation: Operation) => void;
    onDeleteOperation: (operation: Operation) => void;
  }

  let {
    receipts,
    operations,
    categories,
    onAddReceipt,
    onEditReceipt,
    onDeleteReceipt,
    onAddOperation,
    onEditOperation,
    onDeleteOperation,
  }: Props = $props();
</script>

<div class="flex flex-col gap-3">
  <div class="flex justify-end">
    <Button onclick={onAddReceipt}>Добавить чек</Button>
  </div>
  {#if receipts.length === 0}
    <EmptyState
      title="Чеков пока нет"
      description="Добавьте чек, чтобы начать учитывать расходы."
    />
  {:else}
    {#each receipts as receipt (receipt.id)}
      {@const receiptOperations = operations.filter(
        (operation) => operation.receiptId === receipt.id
      )}
      {@const summary = calculateReceiptSummary(receipt, receiptOperations)}
      <section class="flex flex-col gap-2 rounded-lg border p-3">
        <ReceiptCard {receipt} {summary} />
        <div class="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onclick={() => onEditReceipt(receipt)}
            >Изменить чек</Button
          >
          <Button variant="destructive" size="sm" onclick={() => onDeleteReceipt(receipt)}
            >Удалить чек</Button
          >
          <Button size="sm" onclick={() => onAddOperation(receipt.id)}>Добавить операцию</Button>
        </div>
        {#if receiptOperations.length === 0}
          <EmptyState
            title="Операций пока нет"
            description="Добавьте первую операцию в этот чек."
          />
        {:else}
          {#each receiptOperations as operation (operation.id)}
            {@const category = categories.find((entry) => entry.id === operation.categoryId)}
            {@const calculation = calculateOperationNet(operation, summary.effectiveRate)}
            <div class="flex flex-col gap-2 rounded-md bg-muted/30 p-2">
              <OperationCard
                {operation}
                categoryTitle={category?.title ?? 'Категория удалена'}
                categoryArchived={category?.archived ?? true}
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
        {/if}
      </section>
    {/each}
  {/if}
</div>
