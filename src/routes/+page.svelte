<script lang="ts">
  import { getAppContext } from '@/app';
  import { calculatePurchaseSummary } from '@/entities/purchase';
  import type { Purchase } from '@/entities/purchase';
  import { PurchaseEditor } from '@/features/edit-purchase';
  import ConfirmDialog from '@/shared/ui/ConfirmDialog.svelte';
  import EmptyState from '@/shared/ui/EmptyState.svelte';
  import PageHeader from '@/shared/ui/PageHeader.svelte';
  import PageLayout from '@/shared/ui/PageLayout.svelte';
  import { PurchaseList } from '@/widgets/purchase-list';

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  const appContext = getAppContext();
  const app = $derived(appContext.current);
  let editorOpen = $state(false);
  let editingPurchase = $state<Purchase | undefined>();
  let deleteTarget = $state<Purchase | undefined>();
  let deleteOpen = $state(false);
  let actionError = $state('');
  const summaries = $derived.by(
    () =>
      new Map(
        (app?.purchases.purchases ?? []).map((purchase) => {
          const receipts = (app?.receipts.receipts ?? []).filter(
            (receipt) => receipt.purchaseId === purchase.id
          );
          const receiptIds = new Set(receipts.map((receipt) => receipt.id));
          const operations = (app?.operations.operations ?? []).filter((operation) =>
            receiptIds.has(operation.receiptId)
          );

          return [purchase.id, calculatePurchaseSummary(receipts, operations)] as const;
        })
      )
  );

  const newPurchase = () => {
    editingPurchase = undefined;
    editorOpen = true;
  };

  const savePurchase = async (purchase: Purchase) => {
    if (!app) {
      throw new Error('Хранилище ещё не готово.');
    }

    if (editingPurchase) {
      await app.purchases.update(purchase);

      return;
    }

    await app.purchases.add(purchase);
    await goto(resolve('/purchases/[purchaseId]', { purchaseId: purchase.id }));
  };

  const relatedCounts = (purchaseId: string) => {
    if (!app) {
      return { receipts: 0, operations: 0 };
    }

    const receiptIds = new Set(
      app.receipts.receipts
        .filter((receipt) => receipt.purchaseId === purchaseId)
        .map((receipt) => receipt.id)
    );

    return {
      receipts: receiptIds.size,
      operations: app.operations.operations.filter((operation) =>
        receiptIds.has(operation.receiptId)
      ).length,
    };
  };

  const requestDelete = (purchase: Purchase) => {
    deleteTarget = purchase;
    deleteOpen = true;
  };

  const deleteDescription = $derived.by(() => {
    if (!deleteTarget) {
      return '';
    }

    const counts = relatedCounts(deleteTarget.id);

    return [
      `Закупка «${deleteTarget.title}», чеков: ${counts.receipts},`,
      `операций: ${counts.operations}. Категории останутся.`,
    ].join(' ');
  });

  const removePurchase = async () => {
    if (!app || !deleteTarget) {
      return;
    }

    actionError = '';

    try {
      await app.purchases.deletePurchase(deleteTarget.id);
      deleteOpen = false;
      deleteTarget = undefined;
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Не удалось удалить закупку.';
    }
  };
</script>

<svelte:head>
  <title>Закупки</title>
</svelte:head>

<PageHeader>Закупки</PageHeader>

<PageLayout onAdd={newPurchase} showNavigation>
  {#if app}
    {#if actionError}
      <p class="text-sm text-destructive" role="alert">{actionError}</p>
    {/if}
    {#if app.purchases.purchases.length === 0}
      <EmptyState title="Закупок пока нет" description="Создайте первую закупку кнопкой +." />
    {:else}
      <PurchaseList
        purchases={app.purchases.purchases}
        {summaries}
        onEdit={(purchase) => {
          editingPurchase = purchase;
          editorOpen = true;
        }}
        onDelete={requestDelete}
      />
    {/if}
    <PurchaseEditor
      bind:open={editorOpen}
      purchase={editingPurchase}
      onSave={savePurchase}
      onOpenChange={(open) => {
        editorOpen = open;
      }}
    />
    <ConfirmDialog
      bind:open={deleteOpen}
      title="Удалить закупку?"
      description={deleteDescription}
      onOpenChange={(open) => {
        deleteOpen = open;
      }}
      onConfirm={removePurchase}
    />
  {:else}
    <EmptyState title="Загрузка закупок…" />
  {/if}
</PageLayout>
