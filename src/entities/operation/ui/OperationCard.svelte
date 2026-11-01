<script lang="ts">
  import { formatMoney } from '../../../shared/lib/money';
  import type { Operation, OperationCalculation } from '../model';

  interface Props {
    operation: Operation;
    categoryTitle: string;
    categoryArchived?: boolean;
    calculation: OperationCalculation;
  }

  let { operation, categoryTitle, categoryArchived = false, calculation }: Props = $props();
</script>

<article class="rounded-lg border p-4">
  <div class="flex items-start justify-between gap-4">
    <h3 class={categoryArchived ? 'text-muted-foreground' : 'font-medium'}>
      {categoryTitle}
    </h3>
    <strong>{formatMoney(calculation.net)}</strong>
  </div>
  <p class="mt-1 text-sm text-muted-foreground">
    Расход: {formatMoney(operation.amountKopecks)}
    {#if operation.refundKopecks !== undefined}
      · Возврат: {formatMoney(operation.refundKopecks)}
    {/if}
  </p>
  {#if calculation.warnings.length > 0}
    <p class="mt-2 text-sm text-destructive">
      {#if calculation.warnings.includes('negative-net')}
        Итог операции отрицательный
      {/if}
      {#if calculation.warnings.includes('refund-exceeds-expense')}
        Возврат превышает расход
      {/if}
    </p>
  {/if}
  {#if operation.comment}
    <p class="mt-2 text-sm">{operation.comment}</p>
  {/if}
</article>
