<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  import { PurchaseCard } from '../../entities/purchase';
  import type { Purchase, PurchaseSummary } from '../../entities/purchase';

  import { resolve } from '$app/paths';

  interface Props {
    purchases: readonly Purchase[];
    summaries: ReadonlyMap<string, PurchaseSummary>;
    onEdit: (purchase: Purchase) => void;
    onDelete: (purchase: Purchase) => void;
  }

  let { purchases, summaries, onEdit, onDelete }: Props = $props();
</script>

{#each purchases as purchase (purchase.id)}
  {@const summary = summaries.get(purchase.id)}
  {#if summary}
    <article class="rounded-lg border p-1">
      <a class="block" href={resolve('/purchases/[purchaseId]', { purchaseId: purchase.id })}>
        <PurchaseCard {purchase} {summary} />
      </a>
      <div class="flex justify-end gap-2 px-3 pb-3">
        <Button variant="outline" size="sm" onclick={() => onEdit(purchase)}>Изменить</Button>
        <Button variant="destructive" size="sm" onclick={() => onDelete(purchase)}>Удалить</Button>
      </div>
    </article>
  {/if}
{/each}
