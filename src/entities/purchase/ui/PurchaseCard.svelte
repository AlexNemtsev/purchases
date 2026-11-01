<script lang="ts">
  import { formatDateRu } from '../../../shared/lib/date';
  import { formatMoney, formatPermille } from '../../../shared/lib/money';
  import type { Purchase, PurchaseSummary } from '../model';

  interface Props {
    purchase: Purchase;
    summary: PurchaseSummary;
  }

  let { purchase, summary }: Props = $props();
</script>

<article class="rounded-lg border p-4">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h3 class="font-medium">{purchase.title}</h3>
      <p class="mt-1 text-sm text-muted-foreground">{formatDateRu(purchase.date)}</p>
    </div>
    <strong>{formatMoney(summary.gross)}</strong>
  </div>
  <p class="mt-2 text-sm text-muted-foreground">
    Итого: {formatMoney(summary.net)} · Скидка: {formatMoney(summary.discount)}
    ({summary.rate === null ? '—' : formatPermille(summary.rate)})
  </p>
</article>
