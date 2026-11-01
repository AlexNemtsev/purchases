<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Field from '$lib/components/ui/field';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';

  import { categoryForOperation } from '../../../entities/category';
  import type { Category } from '../../../entities/category';
  import type { Operation, OperationRate } from '../../../entities/operation';
  import { calculateOperationNet } from '../../../entities/operation';
  import { createId } from '../../../shared/api';
  import { MAX_COMMENT_LENGTH } from '../../../shared/config';
  import { formatMoney, parseMoney } from '../../../shared/lib/money';
  import AmountOrPercentInput from '../../../shared/ui/AmountOrPercentInput.svelte';
  import EmptyState from '../../../shared/ui/EmptyState.svelte';
  import MoneyInput from '../../../shared/ui/MoneyInput.svelte';
  import WarningList from '../../../shared/ui/WarningList.svelte';

  interface Props {
    open: boolean;
    receiptId: string;
    operation?: Operation;
    categories: readonly Category[];
    receiptRate: OperationRate | null;
    onSave: (operation: Operation) => Promise<void>;
    onOpenChange: (open: boolean) => void;
  }

  let {
    open = $bindable(),
    receiptId,
    operation,
    categories,
    receiptRate,
    onSave,
    onOpenChange,
  }: Props = $props();
  let amountText = $state('');
  let selectedCategoryId = $state('');
  let comment = $state('');
  let refundEnabled = $state(false);
  let refundText = $state('');
  let discountEnabled = $state(false);
  let discountMode = $state<'amount' | 'percent'>('amount');
  let discountValue = $state(0);
  let discountValid = $state(true);
  let error = $state('');
  let saving = $state(false);

  $effect(() => {
    if (!open) {
      return;
    }

    amountText = operation ? formatMoney(operation.amountKopecks).replace(/ ₽$/u, '') : '';

    selectedCategoryId =
      operation && !categoryForOperation(categories, operation.categoryId)?.archived
        ? operation.categoryId
        : '';

    comment = operation?.comment ?? '';
    refundEnabled = operation?.refundKopecks !== undefined;

    refundText =
      operation?.refundKopecks === undefined
        ? ''
        : formatMoney(operation.refundKopecks).replace(/ ₽$/u, '');

    discountEnabled = Boolean(operation?.operationDiscount);
    discountMode = operation?.operationDiscount?.mode ?? 'amount';

    if (!operation?.operationDiscount) {
      discountValue = 0;
    } else if (operation.operationDiscount.mode === 'amount') {
      discountValue = operation.operationDiscount.amountKopecks;
    } else {
      discountValue = operation.operationDiscount.permille;
    }

    error = '';
    discountValid = true;
  });

  const currentCategory = $derived(
    operation ? categoryForOperation(categories, operation.categoryId) : undefined
  );
  const activeCategories = $derived(categories.filter((category) => !category.archived));
  const parsedAmount = $derived(parseMoney(amountText) ?? 0);
  const parsedRefund = $derived(refundEnabled ? (parseMoney(refundText) ?? 0) : undefined);
  const draftOperation = $derived<Operation>({
    id: operation?.id ?? 'draft',
    receiptId,
    categoryId: selectedCategoryId || operation?.categoryId || '',
    amountKopecks: parsedAmount,
    comment,
    ...(parsedRefund === undefined ? {} : { refundKopecks: parsedRefund }),
    ...(discountEnabled
      ? {
          operationDiscount:
            discountMode === 'amount'
              ? { mode: 'amount' as const, amountKopecks: discountValue }
              : { mode: 'percent' as const, permille: discountValue },
        }
      : {}),
    createdAt: operation?.createdAt ?? '',
    updatedAt: operation?.updatedAt ?? '',
  });
  const calculation = $derived(calculateOperationNet(draftOperation, receiptRate));
  const warningMessages = $derived(
    calculation.warnings.map((warning) =>
      warning === 'negative-net' ? 'Итог операции отрицательный.' : 'Возврат превышает расход.'
    )
  );

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    error = '';
    const amountKopecks = parseMoney(amountText);
    let refundKopecks: number | undefined;

    if (amountKopecks === null || amountKopecks <= 0) {
      error = 'Введите сумму расхода больше нуля с точностью до копеек.';

      return;
    }

    if (!selectedCategoryId && !operation?.categoryId) {
      error = 'Выберите активную категорию.';

      return;
    }

    if (refundEnabled) {
      const parsedRefund = parseMoney(refundText);

      if (parsedRefund === null || parsedRefund <= 0) {
        error = 'Введите сумму возврата больше нуля.';

        return;
      }

      refundKopecks = parsedRefund;
    }

    if (discountEnabled && !discountValid) {
      error = 'Проверьте значение индивидуальной скидки.';

      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      error = 'Комментарий не должен превышать 500 символов.';

      return;
    }

    const timestamp = new Date().toISOString();
    const categoryId = selectedCategoryId || operation?.categoryId;

    if (!categoryId) {
      error = 'Выберите активную категорию.';

      return;
    }

    saving = true;

    try {
      await onSave({
        id: operation?.id ?? createId(),
        receiptId,
        categoryId,
        amountKopecks,
        comment: comment.trim(),
        ...(refundKopecks === undefined ? {} : { refundKopecks }),
        ...(discountEnabled
          ? {
              operationDiscount:
                discountMode === 'amount'
                  ? { mode: 'amount', amountKopecks: discountValue }
                  : { mode: 'percent', permille: discountValue },
            }
          : {}),
        createdAt: operation?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });

      open = false;
      onOpenChange(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';

      error = message.includes('category-inactive')
        ? 'Выбранная категория уже архивирована. Выберите активную категорию.'
        : message || 'Не удалось сохранить операцию.';
    } finally {
      saving = false;
    }
  };
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="max-h-[90dvh] overflow-y-auto">
    <form class="flex flex-col gap-4" onsubmit={submit}>
      <Dialog.Header>
        <Dialog.Title>{operation ? 'Изменить операцию' : 'Новая операция'}</Dialog.Title>
      </Dialog.Header>
      <Field.Group>
        <Field.Field>
          <MoneyInput
            id="operation-amount"
            label="Расход до скидок"
            value={amountText}
            onValueChange={(value) => {
              amountText = value;

              if (refundEnabled && !operation) {
                refundText = value;
              }
            }}
          />
        </Field.Field>
        {#if currentCategory?.archived}
          <div class="rounded-md border p-3 text-sm text-muted-foreground">
            Прежняя категория: {currentCategory.title}. Выберите активную категорию, чтобы заменить
            её.
          </div>
        {/if}
        <Field.Field>
          <Label for="operation-category">Категория</Label>
          <select
            id="operation-category"
            class="h-10 rounded-md border bg-background px-3 text-sm"
            bind:value={selectedCategoryId}
          >
            <option value="">Выберите категорию</option>
            {#each activeCategories as category (category.id)}
              <option value={category.id}>{category.title}</option>
            {/each}
          </select>
          {#if activeCategories.length === 0 && !currentCategory?.archived}
            <EmptyState
              title="Нет активных категорий"
              description="Создайте категорию перед добавлением операции."
            />
          {/if}
        </Field.Field>
        <label class="flex items-center gap-2 text-sm" for="operation-refund-enabled">
          <input
            id="operation-refund-enabled"
            type="checkbox"
            class="size-4"
            bind:checked={refundEnabled}
            onchange={(event) => {
              if (event.currentTarget.checked && !refundText) {
                refundText = amountText;
              }
            }}
          />
          Возврат
        </label>
        {#if refundEnabled}
          <Field.Field>
            <MoneyInput
              id="operation-refund"
              label="Сумма возврата"
              value={refundText}
              onValueChange={(value) => (refundText = value)}
            />
          </Field.Field>
        {/if}
        <label class="flex items-center gap-2 text-sm" for="operation-discount-enabled">
          <input
            id="operation-discount-enabled"
            type="checkbox"
            class="size-4"
            bind:checked={discountEnabled}
          />
          Индивидуальная скидка
        </label>
        {#if discountEnabled}
          <AmountOrPercentInput
            id="operation-discount"
            label="Индивидуальная скидка"
            mode={discountMode}
            value={discountValue}
            base={Math.max(0, parsedAmount - (parsedRefund ?? 0))}
            onValidityChange={(valid) => (discountValid = valid)}
            onChange={(mode, value) => {
              discountMode = mode;
              discountValue = value;
            }}
          />
        {/if}
        <Field.Field>
          <Label for="operation-comment">Комментарий</Label>
          <Textarea
            id="operation-comment"
            bind:value={comment}
            maxlength={MAX_COMMENT_LENGTH}
            rows={2}
          />
        </Field.Field>
      </Field.Group>
      <p class="text-sm">Итог операции: <strong>{formatMoney(calculation.net)}</strong></p>
      <WarningList warnings={warningMessages} />
      {#if error}
        <p class="text-sm text-destructive" role="alert">{error}</p>
      {/if}
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (open = false)}>Отмена</Button>
        <Button type="submit" disabled={saving || (activeCategories.length === 0 && !operation)}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
