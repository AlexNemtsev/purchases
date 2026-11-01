<script lang="ts">
  import { formatMoney, formatPermille } from '../../../shared/lib/money';
  import type { Receipt, ReceiptSummary } from '../model';

  interface Props {
    receipt: Receipt;
    summary: ReceiptSummary;
  }

  let { receipt, summary }: Props = $props();
</script>

<article class="rounded-lg border p-4">
  <div class="flex items-start justify-between gap-4">
    <h3 class="font-medium">Чек</h3>
    <strong>{formatMoney(summary.operationsNetKopecks)}</strong>
  </div>
  <p class="mt-1 text-sm text-muted-foreground">
    Сумма: {formatMoney(receipt.amountKopecks)} · Скидка: {formatMoney(summary.discountKopecks)}
    ({summary.effectivePermille === null ? '—' : formatPermille(summary.effectivePermille)})
  </p>
  {#if summary.hasDifference}
    <p class="mt-2 text-sm text-destructive">
      Расхождение с операциями: {formatMoney(summary.differenceKopecks)}
    </p>
  {/if}
  {#if receipt.comment}
    <p class="mt-2 text-sm">{receipt.comment}</p>
  {/if}
</article>
