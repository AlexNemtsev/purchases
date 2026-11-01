<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  interface Props {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
  }

  let {
    open = $bindable(),
    title,
    description,
    confirmLabel = 'Удалить',
    onOpenChange,
    onConfirm,
  }: Props = $props();
</script>

<AlertDialog.Root bind:open {onOpenChange}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{title}</AlertDialog.Title>
      <AlertDialog.Description>{description}</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Отмена</AlertDialog.Cancel>
      <AlertDialog.Action
        variant="destructive"
        onclick={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        {confirmLabel}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
