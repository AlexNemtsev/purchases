<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  import { autoTitle, retitleOnDateChange } from '../../../entities/purchase';
  import type { Purchase } from '../../../entities/purchase';
  import { createId } from '../../../shared/api';
  import { MAX_TITLE_LENGTH } from '../../../shared/config';
  import { formatDateRu, isValidIsoDate, localTodayIso } from '../../../shared/lib/date';

  interface Props {
    open: boolean;
    purchase?: Purchase;
    onSave: (purchase: Purchase) => Promise<void>;
    onOpenChange: (open: boolean) => void;
  }

  let { open = $bindable(), purchase, onSave, onOpenChange }: Props = $props();
  let title = $state('');
  let date = $state('');
  let error = $state('');
  let saving = $state(false);
  const getSaveError = (message: string) => {
    if (message.includes('invalid-title')) {
      return 'Введите название закупки длиной до 100 символов.';
    }

    if (message.includes('invalid-date')) {
      return 'Укажите действительную дату закупки.';
    }

    return message || 'Не удалось сохранить закупку.';
  };

  $effect(() => {
    if (!open) {
      return;
    }

    date = purchase?.date ?? localTodayIso();
    title = purchase?.title ?? autoTitle(date);
    error = '';
  });

  const handleDateChange = (nextDate: string) => {
    if (!purchase) {
      const previousDate = date;
      date = nextDate;

      if (title === autoTitle(previousDate)) {
        title = autoTitle(nextDate);
      }

      return;
    }

    const updated = retitleOnDateChange({ ...purchase, title, date }, nextDate);
    title = updated.title;
    date = nextDate;
  };

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    error = '';
    const normalizedTitle = title.trim();

    if (!normalizedTitle || normalizedTitle.length > MAX_TITLE_LENGTH) {
      error = 'Название обязательно и не должно превышать 100 символов.';

      return;
    }

    if (!isValidIsoDate(date)) {
      error = 'Укажите действительную дату закупки.';

      return;
    }

    saving = true;

    try {
      const timestamp = new Date().toISOString();

      await onSave({
        id: purchase?.id ?? createId(),
        title: normalizedTitle,
        date,
        createdAt: purchase?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });

      open = false;
      onOpenChange(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      error = getSaveError(message);
    } finally {
      saving = false;
    }
  };
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content>
    <form class="flex flex-col gap-4" onsubmit={submit}>
      <Dialog.Header>
        <Dialog.Title>{purchase ? 'Изменить закупку' : 'Новая закупка'}</Dialog.Title>
      </Dialog.Header>
      <Field.Group>
        <Field.Field>
          <Label for="purchase-title">Название</Label>
          <Input id="purchase-title" bind:value={title} maxlength={MAX_TITLE_LENGTH} required />
        </Field.Field>
        <Field.Field>
          <Label for="purchase-date">Дата</Label>
          <Input
            id="purchase-date"
            type="date"
            value={date}
            onchange={(event) => handleDateChange(event.currentTarget.value)}
            required
            aria-describedby="purchase-date-formatted"
          />
          <p id="purchase-date-formatted" class="text-xs text-muted-foreground">
            {isValidIsoDate(date) ? formatDateRu(date) : 'Выберите дату'}
          </p>
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
