<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import type { Purchase, PurchaseSummary } from '@/entities/purchase';
  import { formatDateRu } from '@/shared/lib/date';
  import { formatMoney, formatPermille } from '@/shared/lib/money';

  import { resolve } from '$app/paths';

  interface Props {
    purchase: Purchase;
    summary: PurchaseSummary;
    view: 'receipts' | 'categories';
    onViewChange: (view: 'receipts' | 'categories') => void;
    onEdit: () => void;
    onDelete: () => void;
  }

  let { purchase, summary, view, onViewChange, onEdit, onDelete }: Props = $props();
</script>

<section class="flex flex-col gap-3 rounded-lg border p-4">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <a class="text-sm text-muted-foreground underline" href={resolve('/')}>← Все закупки</a>
      <h1 class="mt-1 text-2xl font-semibold">{purchase.title}</h1>
      <p class="text-sm text-muted-foreground">{formatDateRu(purchase.date)}</p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={onEdit}>Изменить</Button>
      <Button variant="destructive" size="sm" onclick={onDelete}>Удалить</Button>
    </div>
  </div>
  <div>
    <p class="text-lg font-semibold">Итого: {formatMoney(summary.net)}</p>
    <p class="text-sm text-muted-foreground">
      Расходы: {formatMoney(summary.gross)} · Скидка: {formatMoney(summary.discount)}
      ({summary.rate === null ? '—' : formatPermille(summary.rate)})
      {#if summary.refundTotal > 0}
        · Возвраты: {formatMoney(summary.refundTotal)}
      {/if}
    </p>
  </div>
  <nav class="flex gap-2" aria-label="Представление закупки">
    <Button
      variant={view === 'receipts' ? 'default' : 'outline'}
      aria-pressed={view === 'receipts'}
      onclick={() => onViewChange('receipts')}>Чеки</Button
    >
    <Button
      variant={view === 'categories' ? 'default' : 'outline'}
      aria-pressed={view === 'categories'}
      onclick={() => onViewChange('categories')}>Категории</Button
    >
    <a class="inline-flex h-10 items-center px-3 text-sm underline" href={resolve('/categories')}>
      Управление категориями
    </a>
  </nav>
</section>
