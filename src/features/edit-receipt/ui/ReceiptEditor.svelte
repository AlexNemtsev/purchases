<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Field from '$lib/components/ui/field';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';

  import type { PercentBase, Receipt, ReceiptDiscountPart } from '../../../entities/receipt';
  import { createId } from '../../../shared/api';
  import { MAX_COMMENT_LENGTH } from '../../../shared/config';
  import {
    calculateDiscountValue,
    type AmountDiscount,
    type PercentDiscount,
  } from '../../../shared/lib/discount';
  import { formatMoney, parseMoney } from '../../../shared/lib/money';
  import AmountOrPercentInput from '../../../shared/ui/AmountOrPercentInput.svelte';
  import MoneyInput from '../../../shared/ui/MoneyInput.svelte';

  interface Props {
    open: boolean;
    receipt?: Receipt;
    purchaseId: string;
    onSave: (receipt: Receipt) => Promise<void>;
    onOpenChange: (open: boolean) => void;
  }

  let { open = $bindable(), receipt, purchaseId, onSave, onOpenChange }: Props = $props();
  let amountText = $state('');
  let firstMode = $state<'amount' | 'percent'>('amount');
  let firstValue = $state(0);
  let firstValid = $state(true);
  let secondEnabled = $state(false);
  let secondMode = $state<'amount' | 'percent'>('amount');
  let secondValue = $state(0);
  let secondValid = $state(true);
  let percentBase = $state<PercentBase>('original');
  let comment = $state('');
  let error = $state('');
  let saving = $state(false);
  $effect(() => {
    if (!open) {
      return;
    }

    amountText = receipt ? formatMoney(receipt.amountKopecks).replace(/ ₽$/u, '') : '';
    const first = receipt?.discountParts[0] ?? { mode: 'amount', amountKopecks: 0 };
    firstMode = first.mode;
    firstValue = first.mode === 'amount' ? first.amountKopecks : first.permille;
    const second = receipt?.discountParts[1];
    secondEnabled = Boolean(second);

    if (second) {
      secondMode = second.mode;
      secondValue = second.mode === 'amount' ? second.amountKopecks : second.permille;
      percentBase = second.mode === 'percent' ? second.percentBase : 'original';
    } else {
      secondMode = 'amount';
      secondValue = 0;
      percentBase = 'original';
    }

    comment = receipt?.comment ?? '';
    error = '';
    firstValid = true;
    secondValid = true;
  });

  const discountPart = (
    mode: 'amount' | 'percent',
    value: number,
    base: PercentBase = 'original'
  ): ReceiptDiscountPart =>
    mode === 'amount'
      ? ({ mode, amountKopecks: value } satisfies AmountDiscount)
      : ({ mode, permille: value, percentBase: base } satisfies PercentDiscount & {
          percentBase: PercentBase;
        });

  const firstDiscountAmount = $derived(
    calculateDiscountValue(discountPart(firstMode, firstValue), parseMoney(amountText) ?? 0)
  );

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    error = '';
    const amountKopecks = parseMoney(amountText);

    if (amountKopecks === null || amountKopecks <= 0) {
      error = 'Введите сумму чека больше нуля с точностью до копеек.';

      return;
    }

    if (!firstValid || (secondEnabled && !secondValid)) {
      error = 'Проверьте значения скидок.';

      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      error = 'Комментарий не должен превышать 500 символов.';

      return;
    }

    const firstPart = discountPart(firstMode, firstValue);
    const discountParts: Receipt['discountParts'] = secondEnabled
      ? [firstPart, discountPart(secondMode, secondValue, percentBase)]
      : [firstPart];
    const timestamp = new Date().toISOString();
    saving = true;

    try {
      await onSave({
        id: receipt?.id ?? createId(),
        purchaseId,
        amountKopecks,
        discountParts,
        comment: comment.trim(),
        createdAt: receipt?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });

      open = false;
      onOpenChange(false);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Не удалось сохранить чек.';
    } finally {
      saving = false;
    }
  };
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content>
    <form class="flex flex-col gap-4" onsubmit={submit}>
      <Dialog.Header>
        <Dialog.Title>{receipt ? 'Изменить чек' : 'Новый чек'}</Dialog.Title>
      </Dialog.Header>
      <Field.Group>
        <Field.Field>
          <MoneyInput
            id="receipt-amount"
            label="Сумма до скидок"
            value={amountText}
            onValueChange={(value) => (amountText = value)}
          />
        </Field.Field>
        <AmountOrPercentInput
          id="receipt-discount-first"
          label="Первая скидка"
          mode={firstMode}
          value={firstValue}
          base={parseMoney(amountText) ?? 0}
          onValidityChange={(valid) => (firstValid = valid)}
          onChange={(mode, value) => {
            firstMode = mode;
            firstValue = value;
          }}
        />
        {#if secondEnabled}
          <AmountOrPercentInput
            id="receipt-discount-second"
            label="Вторая скидка"
            mode={secondMode}
            value={secondValue}
            base={percentBase === 'afterPrevious'
              ? Math.max(0, (parseMoney(amountText) ?? 0) - firstDiscountAmount)
              : (parseMoney(amountText) ?? 0)}
            onValidityChange={(valid) => (secondValid = valid)}
            onChange={(mode, value) => {
              secondMode = mode;
              secondValue = value;
            }}
          />
          {#if secondMode === 'percent'}
            <Field.Field>
              <Label for="receipt-discount-base">База второй скидки</Label>
              <select
                id="receipt-discount-base"
                class="h-10 rounded-md border bg-background px-3 text-sm"
                bind:value={percentBase}
              >
                <option value="original">Исходная сумма</option>
                <option value="afterPrevious">После первой скидки</option>
              </select>
            </Field.Field>
          {/if}
          <Button type="button" variant="outline" onclick={() => (secondEnabled = false)}>
            Убрать вторую скидку
          </Button>
        {:else}
          <Button
            type="button"
            variant="outline"
            onclick={() => {
              secondEnabled = true;
              secondMode = 'amount';
              secondValue = 0;
            }}>Добавить вторую скидку</Button
          >
        {/if}
        <Field.Field>
          <Label for="receipt-comment">Комментарий</Label>
          <Textarea
            id="receipt-comment"
            bind:value={comment}
            maxlength={MAX_COMMENT_LENGTH}
            rows={2}
          />
        </Field.Field>
      </Field.Group>
      {#if error}
        <p class="text-sm text-destructive" role="alert">{error}</p>
      {/if}
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (open = false)}>Отмена</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
