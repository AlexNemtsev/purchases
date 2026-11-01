<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';

  import type { Category } from '../../../entities/category';
  import { createId } from '../../../shared/api';
  import { MAX_COMMENT_LENGTH, MAX_TITLE_LENGTH } from '../../../shared/config';

  interface Props {
    open: boolean;
    category?: Category;
    onSave: (category: Category) => Promise<void>;
    onOpenChange: (open: boolean) => void;
  }

  let { open = $bindable(), category, onSave, onOpenChange }: Props = $props();
  let title = $state('');
  let comment = $state('');
  let error = $state('');
  let saving = $state(false);
  const getSaveError = (message: string) => {
    if (message.includes('duplicate-title')) {
      return 'Категория с таким названием уже существует, в том числе в архиве.';
    }

    if (message.includes('invalid-title')) {
      return 'Введите название категории длиной до 100 символов.';
    }

    return message || 'Не удалось сохранить категорию.';
  };

  $effect(() => {
    if (!open) {
      return;
    }

    title = category?.title ?? '';
    comment = category?.comment ?? '';
    error = '';
  });

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    error = '';

    const trimmedTitle = title.trim();

    if (!trimmedTitle || trimmedTitle.length > MAX_TITLE_LENGTH) {
      error = 'Введите название категории длиной до 100 символов.';

      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      error = 'Комментарий не должен превышать 500 символов.';

      return;
    }

    saving = true;

    try {
      const timestamp = new Date().toISOString();

      await onSave({
        id: category?.id ?? createId(),
        title: trimmedTitle,
        comment: comment.trim(),
        archived: category?.archived ?? false,
        createdAt: category?.createdAt ?? timestamp,
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
        <Dialog.Title>{category ? 'Изменить категорию' : 'Добавить категорию'}</Dialog.Title>
      </Dialog.Header>
      <Field.Group>
        <Field.Field>
          <Label for="category-title">Название</Label>
          <Input
            id="category-title"
            bind:value={title}
            maxlength={MAX_TITLE_LENGTH}
            required
            autofocus
          />
        </Field.Field>
        <Field.Field>
          <Label for="category-comment">Комментарий</Label>
          <Textarea
            id="category-comment"
            bind:value={comment}
            maxlength={MAX_COMMENT_LENGTH}
            rows={3}
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
