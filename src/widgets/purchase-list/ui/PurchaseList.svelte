<script lang="ts">
  import { PurchaseCard } from '@/entities/purchase';
  import type { Purchase, PurchaseSummary } from '@/entities/purchase';
  import ActionsMenu from '@/shared/ui/ActionsMenu.svelte';

  import { resolve } from '$app/paths';

  interface Props {
    purchases: readonly Purchase[];
    summaries: ReadonlyMap<string, PurchaseSummary>;
    onEdit: (purchase: Purchase) => void;
    onDelete: (purchase: Purchase) => void;
  }

  let { purchases, summaries, onEdit, onDelete }: Props = $props();
  const linkClass = [
    'absolute inset-0 rounded-4xl',
    'focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none',
  ].join(' ');
</script>

{#each purchases as purchase (purchase.id)}
  {@const summary = summaries.get(purchase.id)}
  {#if summary}
    <div class="relative">
      <PurchaseCard {purchase} {summary}>
        {#snippet action()}
          <div class="relative z-10">
            <ActionsMenu
              label={`Действия: ${purchase.title}`}
              actions={[
                { label: 'Изменить', onSelect: () => onEdit(purchase) },
                { label: 'Удалить', destructive: true, onSelect: () => onDelete(purchase) },
              ]}
            />
          </div>
        {/snippet}
      </PurchaseCard>
      <a
        class={linkClass}
        href={resolve('/purchases/[purchaseId]', { purchaseId: purchase.id })}
        aria-label={`Открыть закупку ${purchase.title}`}
      ></a>
    </div>
  {/if}
{/each}
