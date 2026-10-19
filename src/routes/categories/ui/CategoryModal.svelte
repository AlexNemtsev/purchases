<script lang="ts">
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';

  import type { ModalStore } from '../lib/ModalStore.svelte';

  interface Props {
    modalStore: ModalStore;
  }

  let { modalStore }: Props = $props();
</script>

<Dialog.Root bind:open={modalStore.modalState.open}>
  <Dialog.Content>
    <form onsubmit={modalStore.onSubmit} class="flex flex-col gap-4">
      <Dialog.Header>
        <Dialog.DialogTitle>
          {modalStore.modalState.mode === 'edit' ? 'Изменить' : 'Добавить'} категорию
        </Dialog.DialogTitle>
      </Dialog.Header>
      <Field.Group>
        <Field.Field>
          <Label for="title">Название</Label>
          <Input id="title" name="title" bind:value={modalStore.modalState.title} required />
        </Field.Field>
        <Field.Field>
          <Label for="comment">Комментарий</Label>
          <Textarea
            id="comment"
            name="comment"
            rows={2}
            bind:value={modalStore.modalState.comment}
          />
        </Field.Field>
      </Field.Group>
      <Dialog.Footer class="flex-row justify-end">
        <Dialog.Close
          type="button"
          class={buttonVariants({ variant: 'outline' })}
          onclick={modalStore.resetModal}
        >
          Отмена
        </Dialog.Close>
        <Button type="submit" disabled={!modalStore.modalState.title.length}>Сохранить</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
