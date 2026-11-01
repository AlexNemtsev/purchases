<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { getAppContext } from '@/app/model/context.svelte';
  import type { Operation } from '@/entities/operation';
  import { calculatePurchaseSummary } from '@/entities/purchase';
  import type { Purchase } from '@/entities/purchase';
  import type { Receipt } from '@/entities/receipt';
  import { calculateReceiptEffectiveRate } from '@/entities/receipt';
  import OperationEditor from '@/features/edit-operation/ui/OperationEditor.svelte';
  import PurchaseEditor from '@/features/edit-purchase/ui/PurchaseEditor.svelte';
  import ReceiptEditor from '@/features/edit-receipt/ui/ReceiptEditor.svelte';
  import { formatMoney } from '@/shared/lib/money';
  import ConfirmDialog from '@/shared/ui/ConfirmDialog.svelte';
  import EmptyState from '@/shared/ui/EmptyState.svelte';
  import PageHeader from '@/shared/ui/PageHeader.svelte';
  import PageLayout from '@/shared/ui/PageLayout.svelte';
  import PurchaseByCategories from '@/widgets/purchase-by-categories/PurchaseByCategories.svelte';
  import PurchaseByReceipts from '@/widgets/purchase-by-receipts/PurchaseByReceipts.svelte';
  import PurchaseHeader from '@/widgets/purchase-header/PurchaseHeader.svelte';

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
  let operationEditorOpen = $state(false);
  let editingReceipt = $state<Receipt | undefined>();
  let editingOperation = $state<Operation | undefined>();
  let selectedReceiptId = $state('');
  let deletePurchaseOpen = $state(false);
  let deleteReceiptOpen = $state(false);
  let deleteOperationOpen = $state(false);
  let receiptToDelete = $state<Receipt | undefined>();
  let operationToDelete = $state<Operation | undefined>();
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
  const selectedReceipt = $derived(receipts.find((receipt) => receipt.id === selectedReceiptId));
  const selectedReceiptRate = $derived(
    selectedReceipt ? calculateReceiptEffectiveRate(selectedReceipt) : null
  );

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

  const saveOperation = async (operation: Operation) => {
    if (!app) {
      throw new Error('Хранилище ещё не готово.');
    }

    const category = app.categories.categories.find((entry) => entry.id === operation.categoryId);
    const categoryIsActive = Boolean(category && !category.archived);

    if (editingOperation) {
      await app.operations.update(operation, categoryIsActive, editingOperation.categoryId);
    } else {
      await app.operations.add(operation, categoryIsActive);
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
  const deleteOperationDescription = $derived(
    operationToDelete
      ? `Операция на ${formatMoney(operationToDelete.amountKopecks)} будет удалена.`
      : ''
  );

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

  const removeOperation = async () => {
    if (!app || !operationToDelete) {
      return;
    }

    actionError = '';

    try {
      await app.operations.remove(operationToDelete.id);
      deleteOperationOpen = false;
      operationToDelete = undefined;
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Не удалось удалить операцию.';
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

  const requestAddOperation = (receiptId: string) => {
    selectedReceiptId = receiptId;
    editingOperation = undefined;
    operationEditorOpen = true;
  };

  const requestEditOperation = (operation: Operation) => {
    selectedReceiptId = operation.receiptId;
    editingOperation = operation;
    operationEditorOpen = true;
  };
</script>

<svelte:head>
  <title>{purchase ? `${purchase.title} — Закупка` : 'Закупка'}</title>
</svelte:head>

<PageHeader>{purchase?.title ?? 'Закупка'}</PageHeader>

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
        {receipts}
        {operations}
        categories={app.categories.categories}
        onAddReceipt={requestAddReceipt}
        onEditReceipt={requestEditReceipt}
        onDeleteReceipt={(receipt) => {
          receiptToDelete = receipt;
          deleteReceiptOpen = true;
        }}
        onAddOperation={requestAddOperation}
        onEditOperation={requestEditOperation}
        onDeleteOperation={(operation) => {
          operationToDelete = operation;
          deleteOperationOpen = true;
        }}
      />
    {:else}
      <div class="flex justify-end">
        <Button onclick={requestAddReceipt}>Добавить чек</Button>
      </div>
      <PurchaseByCategories
        {operations}
        categories={app.categories.categories}
        {receiptsById}
        onEditOperation={requestEditOperation}
        onDeleteOperation={(operation) => {
          operationToDelete = operation;
          deleteOperationOpen = true;
        }}
      />
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
    <OperationEditor
      bind:open={operationEditorOpen}
      receiptId={selectedReceiptId}
      operation={editingOperation}
      categories={app.categories.categories}
      receiptRate={selectedReceiptRate}
      onSave={saveOperation}
      onOpenChange={(open) => (operationEditorOpen = open)}
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
    <ConfirmDialog
      bind:open={deleteOperationOpen}
      title="Удалить операцию?"
      description={deleteOperationDescription}
      onOpenChange={(open) => (deleteOperationOpen = open)}
      onConfirm={removeOperation}
    />
  {/if}
</PageLayout>
