<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import type { Operation } from '@/entities/operation';
  import { calculateReceiptSummary, ReceiptCard } from '@/entities/receipt';
  import type { Receipt } from '@/entities/receipt';
  import ActionsMenu from '@/shared/ui/ActionsMenu.svelte';
  import EmptyState from '@/shared/ui/EmptyState.svelte';

  import { resolve } from '$app/paths';

  interface Props {
    purchaseId: string;
    receipts: readonly Receipt[];
    operations: readonly Operation[];
    onAddReceipt: () => void;
    onEditReceipt: (receipt: Receipt) => void;
    onDeleteReceipt: (receipt: Receipt) => void;
  }

  let { purchaseId, receipts, operations, onAddReceipt, onEditReceipt, onDeleteReceipt }: Props =
    $props();
  const linkClass = [
    'absolute inset-0 rounded-4xl',
    'focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none',
  ].join(' ');
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
      {@const summary = calculateReceiptSummary(
        receipt,
        operations.filter((operation) => operation.receiptId === receipt.id)
      )}
      <div class="relative">
        <ReceiptCard {receipt} {summary}>
          {#snippet action()}
            <div class="relative z-10">
              <ActionsMenu
                label="Действия с чеком"
                actions={[
                  { label: 'Изменить', onSelect: () => onEditReceipt(receipt) },
                  {
                    label: 'Удалить',
                    destructive: true,
                    onSelect: () => onDeleteReceipt(receipt),
                  },
                ]}
              />
            </div>
          {/snippet}
        </ReceiptCard>
        <a
          class={linkClass}
          href={resolve('/purchases/[purchaseId]/receipts/[receiptId]', {
            purchaseId,
            receiptId: receipt.id,
          })}
          aria-label="Открыть чек"
        ></a>
      </div>
    {/each}
  {/if}
</div>
