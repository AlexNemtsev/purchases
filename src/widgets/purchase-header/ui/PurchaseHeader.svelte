<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import type { Purchase, PurchaseSummary } from '@/entities/purchase';
  import { formatDateRu } from '@/shared/lib/date';
  import { formatMoney, formatPermille } from '@/shared/lib/money';
  import ActionsMenu from '@/shared/ui/ActionsMenu.svelte';

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

<Card.Root size="sm">
  <Card.Header>
    <Card.Title class="text-2xl">Итого: {formatMoney(summary.net)}</Card.Title>
    <Card.Description>{formatDateRu(purchase.date)}</Card.Description>
    <Card.Action>
      <ActionsMenu
        label="Действия с закупкой"
        actions={[
          { label: 'Изменить', onSelect: onEdit },
          { label: 'Удалить', destructive: true, onSelect: onDelete },
        ]}
      />
    </Card.Action>
  </Card.Header>
  <Card.Content class="flex flex-col gap-3">
    <p class="text-sm text-muted-foreground">
      Расходы: {formatMoney(summary.gross)} · Скидка: {formatMoney(summary.discount)}
      ({summary.rate === null ? '—' : formatPermille(summary.rate)})
      {#if summary.refundTotal > 0}
        · Возвраты: {formatMoney(summary.refundTotal)}
      {/if}
    </p>
    <ToggleGroup.Root
      type="single"
      variant="outline"
      value={view}
      onValueChange={(next) => {
        if (next === 'receipts' || next === 'categories') {
          onViewChange(next);
        }
      }}
      aria-label="Представление закупки"
    >
      <ToggleGroup.Item value="receipts" class="flex-1">Чеки</ToggleGroup.Item>
      <ToggleGroup.Item value="categories" class="flex-1">Категории</ToggleGroup.Item>
    </ToggleGroup.Root>
    <Button
      variant="link"
      class="self-start px-0"
      href={`${resolve('/categories')}?from=${encodeURIComponent(purchase.id)}`}
    >
      Управление категориями
    </Button>
  </Card.Content>
</Card.Root>
