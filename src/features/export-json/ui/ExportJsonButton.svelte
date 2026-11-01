<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  import { localTodayIso } from '../../../shared/lib/date';

  interface Props {
    getDocument: () => Promise<object>;
  }

  let { getDocument }: Props = $props();
  let exporting = $state(false);
  let error = $state('');

  const exportDocument = async () => {
    error = '';
    exporting = true;

    try {
      const document = await getDocument();

      const exportData = { ...document, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `purchase-tracker-${localTodayIso()}.json`;
      window.document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Не удалось выгрузить данные.';
    } finally {
      exporting = false;
    }
  };
</script>

<div class="flex flex-col gap-2">
  <Button onclick={exportDocument} disabled={exporting}>
    {exporting ? 'Подготовка файла…' : 'Выгрузить JSON'}
  </Button>
  {#if error}
    <p class="text-sm text-destructive" role="alert">{error}</p>
  {/if}
</div>
