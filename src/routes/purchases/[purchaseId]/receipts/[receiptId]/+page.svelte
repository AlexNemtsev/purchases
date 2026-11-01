<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { getAppContext } from '@/app';
  import type { Operation } from '@/entities/operation';
  import {
    calculateReceiptEffectiveRate,
    calculateReceiptSummary,
    ReceiptCard,
  } from '@/entities/receipt';
  import type { Receipt } from '@/entities/receipt';
  import { OperationEditor } from '@/features/edit-operation';
  import { ReceiptEditor } from '@/features/edit-receipt';
  import { formatMoney } from '@/shared/lib/money';
  import ActionsMenu from '@/shared/ui/ActionsMenu.svelte';
  import ConfirmDialog from '@/shared/ui/ConfirmDialog.svelte';
  import EmptyState from '@/shared/ui/EmptyState.svelte';
  import PageHeader from '@/shared/ui/PageHeader.svelte';
  import PageLayout from '@/shared/ui/PageLayout.svelte';
  import { ReceiptOperations } from '@/widgets/receipt-operations';

  import type { PageProps } from './$types';

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  let { params }: PageProps = $props();
  const purchaseId = $derived(params.purchaseId);
  const receiptId = $derived(params.receiptId);
  const appContext = getAppContext();
  const app = $derived(appContext.current);
  let receiptEditorOpen = $state(false);
  let operationEditorOpen = $state(false);
  let editingOperation = $state<Operation | undefined>();
  let deleteReceiptOpen = $state(false);
  let deleteOperationOpen = $state(false);
  let operationToDelete = $state<Operation | undefined>();
  let actionError = $state('');

  const receipt = $derived(
    app?.receipts.receipts.find(
      (entry) => entry.id === receiptId && entry.purchaseId === purchaseId
    )
  );
  const operations = $derived(
    app?.operations.operations.filter((operation) => operation.receiptId === receiptId) ?? []
  );
  const summary = $derived(receipt ? calculateReceiptSummary(receipt, operations) : undefined);
  const receiptRate = $derived(receipt ? calculateReceiptEffectiveRate(receipt) : null);
  const backHref = $derived(resolve('/purchases/[purchaseId]', { purchaseId }));

  const saveReceipt = async (updated: Receipt) => {
    if (!app) {
      throw new Error('Хранилище ещё не готово.');
    }

    await app.receipts.update(updated);
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

  const deleteReceiptDescription = $derived(
    `Будет удалён чек и связанных операций: ${operations.length}.`
  );
  const deleteOperationDescription = $derived(
    operationToDelete
      ? `Операция на ${formatMoney(operationToDelete.amountKopecks)} будет удалена.`
      : ''
  );

  const removeReceipt = async () => {
    if (!app || !receipt) {
      return;
    }

    actionError = '';

    try {
      await app.receipts.remove(receipt.id);
      await goto(resolve('/purchases/[purchaseId]', { purchaseId }));
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
</script>

<svelte:head>
  <title>Чек — Закупка</title>
</svelte:head>

<PageHeader {backHref} backLabel="К закупке">Чек</PageHeader>

<PageLayout showNavigation>
  {#if !app}
    <EmptyState title="Загрузка чека…" />
  {:else if !receipt || !summary}
    <EmptyState title="Чек не найден" description="Возможно, он был удалён." />
    <Button onclick={() => goto(resolve('/purchases/[purchaseId]', { purchaseId }))}
      >К закупке</Button
    >
  {:else}
    {#if actionError}
      <p class="text-sm text-destructive" role="alert">{actionError}</p>
    {/if}
    <ReceiptCard {receipt} {summary}>
      {#snippet action()}
        <ActionsMenu
          label="Действия с чеком"
          actions={[
            { label: 'Изменить', onSelect: () => (receiptEditorOpen = true) },
            { label: 'Удалить', destructive: true, onSelect: () => (deleteReceiptOpen = true) },
          ]}
        />
      {/snippet}
    </ReceiptCard>
    <ReceiptOperations
      {operations}
      categories={app.categories.categories}
      rate={receiptRate}
      onAddOperation={() => {
        editingOperation = undefined;
        operationEditorOpen = true;
      }}
      onEditOperation={(operation) => {
        editingOperation = operation;
        operationEditorOpen = true;
      }}
      onDeleteOperation={(operation) => {
        operationToDelete = operation;
        deleteOperationOpen = true;
      }}
    />
    <ReceiptEditor
      bind:open={receiptEditorOpen}
      {receipt}
      {purchaseId}
      onSave={saveReceipt}
      onOpenChange={(open) => (receiptEditorOpen = open)}
    />
    <OperationEditor
      bind:open={operationEditorOpen}
      {receiptId}
      operation={editingOperation}
      categories={app.categories.categories}
      {receiptRate}
      onSave={saveOperation}
      onOpenChange={(open) => (operationEditorOpen = open)}
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
