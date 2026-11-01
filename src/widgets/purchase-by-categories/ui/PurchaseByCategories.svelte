<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { CategoryBadge, calculateCategorySummary } from '@/entities/category';
  import type { Category } from '@/entities/category';
  import type { Operation } from '@/entities/operation';
  import type { Receipt } from '@/entities/receipt';
  import { formatMoney } from '@/shared/lib/money';
  import EmptyState from '@/shared/ui/EmptyState.svelte';

  interface Props {
    operations: readonly Operation[];
    categories: readonly Category[];
    receiptsById: ReadonlyMap<string, Receipt>;
  }

  let { operations, categories, receiptsById }: Props = $props();
  const grouped = $derived(
    categories
      .map((category) => ({
        category,
        operations: operations.filter((operation) => operation.categoryId === category.id),
      }))
      .filter((group) => group.operations.length > 0)
  );
</script>

{#if operations.length === 0}
  <EmptyState
    title="Операций пока нет"
    description="Добавьте чек и операции, чтобы увидеть распределение по категориям."
  />
{:else}
  {#each grouped as group (group.category.id)}
    {@const summary = calculateCategorySummary(group.operations, receiptsById)}
    <Card.Root size="sm">
      <Card.Content class="flex flex-wrap items-center justify-between gap-2">
        <CategoryBadge category={group.category} />
        <p class="text-sm text-muted-foreground">
          Расходы: {formatMoney(summary.gross)} · Итого: {formatMoney(summary.net)}
        </p>
      </Card.Content>
    </Card.Root>
  {/each}
{/if}
