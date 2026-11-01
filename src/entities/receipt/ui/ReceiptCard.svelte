<script lang="ts">
  import type { Snippet } from 'svelte';

  import * as Card from '$lib/components/ui/card';

  import { formatMoney, formatPermille } from '../../../shared/lib/money';
  import type { Receipt, ReceiptSummary } from '../model';

  interface Props {
    receipt: Receipt;
    summary: ReceiptSummary;
    action?: Snippet;
  }

  let { receipt, summary, action }: Props = $props();
</script>

<Card.Root size="sm">
  <Card.Header>
    <Card.Title class="text-base">Чек · {formatMoney(summary.operationsNetKopecks)}</Card.Title>
    <Card.Description>
      Сумма: {formatMoney(receipt.amountKopecks)} · Скидка: {formatMoney(summary.discountKopecks)}
      ({summary.effectivePermille === null ? '—' : formatPermille(summary.effectivePermille)})
    </Card.Description>
    {#if action}
      <Card.Action>{@render action()}</Card.Action>
    {/if}
  </Card.Header>
  {#if summary.hasDifference || receipt.comment}
    <Card.Content class="flex flex-col gap-1">
      {#if summary.hasDifference}
        <p class="text-sm text-destructive">
          Расхождение с операциями: {formatMoney(summary.differenceKopecks)}
        </p>
      {/if}
      {#if receipt.comment}
        <p class="text-sm">{receipt.comment}</p>
      {/if}
    </Card.Content>
  {/if}
</Card.Root>
