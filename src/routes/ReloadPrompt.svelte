<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/';

  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(swr) {
      console.log(`SW registered: ${swr}`);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    offlineReady.set(false);
    needRefresh.set(false);
  };

  const toast = $derived($offlineReady || $needRefresh);
</script>

<AlertDialog.Root open={toast}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      {#if $offlineReady}
        <AlertDialog.Title>Приложение готово к работе в режиме оффлайн</AlertDialog.Title>
      {:else}
        <AlertDialog.Title>Обновление</AlertDialog.Title>
        <AlertDialog.Description>
          Доступно новое содержимое. Нажмите на кнопку перезагрузки, чтобы обновить приложение.
        </AlertDialog.Description>
      {/if}
    </AlertDialog.Header>

    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={close}>Закрыть</AlertDialog.Cancel>
      {#if $needRefresh}
        <AlertDialog.Action onclick={() => updateServiceWorker(true)}
          >Перезагрузить</AlertDialog.Action
        >
      {/if}
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
