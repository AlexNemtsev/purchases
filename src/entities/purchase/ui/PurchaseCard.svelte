<script lang="ts">
  import type { Snippet } from 'svelte';

  import * as Card from '$lib/components/ui/card';

  import { formatDateRu } from '../../../shared/lib/date';
  import { formatMoney, formatPermille } from '../../../shared/lib/money';
  import type { Purchase, PurchaseSummary } from '../model';

  interface Props {
    purchase: Purchase;
    summary: PurchaseSummary;
    action?: Snippet;
  }

  let { purchase, summary, action }: Props = $props();
</script>

<Card.Root size="sm">
  <Card.Header>
    <Card.Title class="text-base">{purchase.title}</Card.Title>
    <Card.Description>{formatDateRu(purchase.date)}</Card.Description>
    {#if action}
      <Card.Action>{@render action()}</Card.Action>
    {/if}
  </Card.Header>
  <Card.Content class="flex flex-col gap-1">
    <strong>{formatMoney(summary.gross)}</strong>
    <p class="text-sm text-muted-foreground">
      Итого: {formatMoney(summary.net)} · Скидка: {formatMoney(summary.discount)}
      ({summary.rate === null ? '—' : formatPermille(summary.rate)})
    </p>
  </Card.Content>
</Card.Root>
