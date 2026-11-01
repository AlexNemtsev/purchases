<script lang="ts">
  import type { Snippet } from 'svelte';

  import * as Card from '$lib/components/ui/card';

  import { formatMoney } from '../../../shared/lib/money';
  import type { Operation, OperationCalculation } from '../model';

  interface Props {
    operation: Operation;
    categoryTitle: string;
    categoryArchived?: boolean;
    calculation: OperationCalculation;
    action?: Snippet;
  }

  let { operation, categoryTitle, categoryArchived = false, calculation, action }: Props = $props();
</script>

<Card.Root size="sm">
  <Card.Header>
    <Card.Title class={categoryArchived ? 'text-base text-muted-foreground' : 'text-base'}>
      {categoryTitle} · {formatMoney(calculation.net)}
    </Card.Title>
    <Card.Description>
      Расход: {formatMoney(operation.amountKopecks)}
      {#if operation.refundKopecks !== undefined}
        · Возврат: {formatMoney(operation.refundKopecks)}
      {/if}
    </Card.Description>
    {#if action}
      <Card.Action>{@render action()}</Card.Action>
    {/if}
  </Card.Header>
  {#if calculation.warnings.length > 0 || operation.comment}
    <Card.Content class="flex flex-col gap-1">
      {#if calculation.warnings.includes('negative-net')}
        <p class="text-sm text-destructive">Итог операции отрицательный</p>
      {/if}
      {#if calculation.warnings.includes('refund-exceeds-expense')}
        <p class="text-sm text-destructive">Возврат превышает расход</p>
      {/if}
      {#if operation.comment}
        <p class="text-sm">{operation.comment}</p>
      {/if}
    </Card.Content>
  {/if}
</Card.Root>
