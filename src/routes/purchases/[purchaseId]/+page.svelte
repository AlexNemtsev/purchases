<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { getAppContext } from '@/app';
  import { calculatePurchaseSummary } from '@/entities/purchase';
  import type { Purchase } from '@/entities/purchase';
  import type { Receipt } from '@/entities/receipt';
  import { PurchaseEditor } from '@/features/edit-purchase';
  import { ReceiptEditor } from '@/features/edit-receipt';
  import ConfirmDialog from '@/shared/ui/ConfirmDialog.svelte';
  import EmptyState from '@/shared/ui/EmptyState.svelte';
  import PageHeader from '@/shared/ui/PageHeader.svelte';
  import PageLayout from '@/shared/ui/PageLayout.svelte';
  import { PurchaseByCategories } from '@/widgets/purchase-by-categories';
  import { PurchaseByReceipts } from '@/widgets/purchase-by-receipts';
  import { PurchaseHeader } from '@/widgets/purchase-header';

  import type { PageProps } from './$types';

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  let { params }: PageProps = $props();
  const purchaseId = $derived(params.purchaseId);
  const appContext = getAppContext();
  const app = $derived(appContext.current);
  let view = $state<'receipts' | 'categories'>('receipts');
  let purchaseEditorOpen = $state(false);
  let receiptEditorOpen = $state(false);
  let editingReceipt = $state<Receipt | undefined>();
  let deletePurchaseOpen = $state(false);
  let deleteReceiptOpen = $state(false);
  let receiptToDelete = $state<Receipt | undefined>();
  let actionError = $state('');

  const purchase = $derived(app?.purchases.purchases.find((entry) => entry.id === purchaseId));
  const receipts = $derived(
    app?.receipts.receipts.filter((receipt) => receipt.purchaseId === purchaseId) ?? []
  );
  const receiptIds = $derived(new Set(receipts.map((receipt) => receipt.id)));
  const operations = $derived(
    app?.operations.operations.filter((operation) => receiptIds.has(operation.receiptId)) ?? []
  );
  const receiptsById = $derived(new Map(receipts.map((receipt) => [receipt.id, receipt])));
  const summary = $derived(calculatePurchaseSummary(receipts, operations));
  const savePurchase = async (updated: Purchase) => {
    if (!app) {
      throw new Error('Хранилище ещё не готово.');
    }

    await app.purchases.update(updated);
  };

  const saveReceipt = async (receipt: Receipt) => {
    if (!app) {
      throw new Error('Хранилище ещё не готово.');
    }

    if (editingReceipt) {
      await app.receipts.update(receipt);
    } else {
      await app.receipts.add(receipt);
    }
  };

  const deletePurchaseDescription = $derived.by(() => {
    const operationCount = operations.length;

    return [
      `Закупка «${purchase?.title ?? ''}», чеков: ${receipts.length},`,
      `операций: ${operationCount}. Категории останутся.`,
    ].join(' ');
  });
  const deleteReceiptDescription = $derived.by(() => {
    const operationCount = receiptToDelete
      ? operations.filter((operation) => operation.receiptId === receiptToDelete?.id).length
      : 0;

    return `Будет удалён чек и связанных операций: ${operationCount}.`;
  });
  const removePurchase = async () => {
    if (!app || !purchase) {
      return;
    }

    actionError = '';

    try {
      await app.purchases.deletePurchase(purchase.id);
      await goto(resolve('/'));
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Не удалось удалить закупку.';
    }
  };

  const removeReceipt = async () => {
    if (!app || !receiptToDelete) {
      return;
    }

    actionError = '';

    try {
      await app.receipts.remove(receiptToDelete.id);
      deleteReceiptOpen = false;
      receiptToDelete = undefined;
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Не удалось удалить чек.';
    }
  };

  const requestAddReceipt = () => {
    editingReceipt = undefined;
    receiptEditorOpen = true;
  };

  const requestEditReceipt = (receipt: Receipt) => {
    editingReceipt = receipt;
    receiptEditorOpen = true;
  };
</script>

<svelte:head>
  <title>{purchase ? `${purchase.title} — Закупка` : 'Закупка'}</title>
</svelte:head>

<PageHeader backHref={resolve('/')} backLabel="Все закупки"
  >{purchase?.title ?? 'Закупка'}</PageHeader
>

<PageLayout showNavigation>
  {#if !app}
    <EmptyState title="Загрузка закупки…" />
  {:else if !purchase}
    <EmptyState title="Закупка не найдена" description="Возможно, она была удалена." />
    <Button onclick={() => goto(resolve('/'))}>К списку закупок</Button>
  {:else}
    {#if actionError}
      <p class="text-sm text-destructive" role="alert">{actionError}</p>
    {/if}
    <PurchaseHeader
      {purchase}
      {summary}
      {view}
      onViewChange={(nextView) => (view = nextView)}
      onEdit={() => (purchaseEditorOpen = true)}
      onDelete={() => (deletePurchaseOpen = true)}
    />
    {#if view === 'receipts'}
      <PurchaseByReceipts
        {purchaseId}
        {receipts}
        {operations}
        onAddReceipt={requestAddReceipt}
        onEditReceipt={requestEditReceipt}
        onDeleteReceipt={(receipt) => {
          receiptToDelete = receipt;
          deleteReceiptOpen = true;
        }}
      />
    {:else}
      <div class="flex justify-end">
        <Button onclick={requestAddReceipt}>Добавить чек</Button>
      </div>
      <PurchaseByCategories {operations} categories={app.categories.categories} {receiptsById} />
    {/if}
    <PurchaseEditor
      bind:open={purchaseEditorOpen}
      {purchase}
      onSave={savePurchase}
      onOpenChange={(open) => (purchaseEditorOpen = open)}
    />
    <ReceiptEditor
      bind:open={receiptEditorOpen}
      receipt={editingReceipt}
      {purchaseId}
      onSave={saveReceipt}
      onOpenChange={(open) => (receiptEditorOpen = open)}
    />
    <ConfirmDialog
      bind:open={deletePurchaseOpen}
      title="Удалить закупку?"
      description={deletePurchaseDescription}
      onOpenChange={(open) => (deletePurchaseOpen = open)}
      onConfirm={removePurchase}
    />
    <ConfirmDialog
      bind:open={deleteReceiptOpen}
      title="Удалить чек?"
      description={deleteReceiptDescription}
      onOpenChange={(open) => (deleteReceiptOpen = open)}
      onConfirm={removeReceipt}
    />
  {/if}
</PageLayout>
