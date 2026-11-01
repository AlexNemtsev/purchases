<script lang="ts">
  // @ts-expect-error Виртуальный плагин
  import { pwaInfo } from 'virtual:pwa-info';

  import { ModeWatcher } from 'mode-watcher';
  import { onMount, setContext } from 'svelte';

  import { APP_CONTEXT_KEY, type AppDocument, type AppServices } from '../app/model/context.svelte';
  import { createEmptyAppDocument, validateAppDocument } from '../app/model/storage';
  import { createCategoryStore } from '../entities/category';
  import { createOperationStore } from '../entities/operation';
  import { createPurchaseStore } from '../entities/purchase';
  import { createReceiptStore } from '../entities/receipt';
  import {
    createDocumentStore,
    createLocalStorageAdapter,
    DocumentStoreError,
  } from '../shared/api/document-store';

  import './app.css';

  const webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

  let { children } = $props();
  let services = $state<AppServices | null>(null);
  let storageError = $state<DocumentStoreError | null>(null);
  let rawDownloadError = $state('');
  let persistenceStatus = $state('');

  setContext(APP_CONTEXT_KEY, {
    get current() {
      return services;
    },
  });

  onMount(() => {
    const documentStore = createDocumentStore<AppDocument>(
      createLocalStorageAdapter(window.localStorage, window),
      { createEmptyDocument: createEmptyAppDocument, validateDocument: validateAppDocument }
    );

    services = {
      documentStore,
      purchases: createPurchaseStore(documentStore),
      receipts: createReceiptStore(documentStore),
      operations: createOperationStore(documentStore),
      categories: createCategoryStore(documentStore),
    };

    void documentStore.getDocument().catch((error: unknown) => {
      storageError =
        error instanceof DocumentStoreError
          ? error
          : new DocumentStoreError('load-failed', 'Не удалось загрузить локальные данные', {
              cause: error,
            });

      console.error('Could not initialize purchase storage', error);
    });

    if (navigator.storage?.persist) {
      void navigator.storage.persist().then(
        (persisted) => {
          persistenceStatus = persisted
            ? 'Хранилище защищено от автоматической очистки браузером.'
            : 'Браузер не подтвердил постоянное хранение данных.';
        },
        (error: unknown) => {
          persistenceStatus = 'Не удалось запросить постоянное хранение данных.';
          console.error('Could not request persistent storage', error);
        }
      );
    }

    return () => {
      services?.categories.destroy();
      services?.operations.destroy();
      services?.receipts.destroy();
      services?.purchases.destroy();
      documentStore.destroy();
    };
  });

  const activeStorageError = $derived(
    storageError ??
      services?.purchases.error ??
      services?.receipts.error ??
      services?.operations.error ??
      services?.categories.error ??
      null
  );
  const storageErrorDescription = $derived.by(() => {
    if (!activeStorageError) {
      return '';
    }

    switch (activeStorageError.code) {
      case 'invalid-json':
        return 'Не удалось прочитать локальные данные: содержимое не является корректным JSON.';
      case 'invalid-document':
        return 'Структура локальных данных повреждена или не соответствует ожидаемому формату.';
      case 'unknown-schema-version':
        return 'Версия локальных данных не поддерживается этой версией приложения.';
      case 'write-failed':
        return 'Не удалось сохранить изменения. Последние успешно сохранённые данные не изменены.';
      case 'load-failed':
        return 'Не удалось загрузить локальные данные.';
    }
  });
  const storageErrorDetails = $derived.by(() => {
    if (!activeStorageError) {
      return '';
    }

    const cause = activeStorageError.cause;

    return cause instanceof Error
      ? `${activeStorageError.message}: ${cause.message}`
      : activeStorageError.message;
  });

  const downloadRawStorage = () => {
    rawDownloadError = '';

    try {
      const raw = services?.documentStore.getRawValue();

      if (raw === null || raw === undefined) {
        rawDownloadError = 'В хранилище нет исходного значения для скачивания.';

        return;
      }

      const link = document.createElement('a');
      const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
      link.href = url;
      link.download = 'purchase-tracker-raw-data.json';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      rawDownloadError =
        error instanceof Error ? error.message : 'Не удалось скачать исходные данные.';
    }
  };
</script>

<svelte:head>
  {@html webManifestLink}
</svelte:head>

<ModeWatcher />
<main
  class="flex h-dvh w-dvw flex-col items-center
  justify-between p-6 pb-[env(safe-area-inset-bottom)]"
>
  {#if activeStorageError}
    <section
      class="m-auto flex w-full max-w-xl flex-col gap-4 rounded-lg border border-destructive/40 p-6"
      role="alert"
    >
      <h1 class="text-xl font-semibold text-destructive">Ошибка локального хранилища</h1>
      <p>{storageErrorDescription}</p>
      {#if activeStorageError.code !== 'write-failed'}
        <p class="text-sm text-muted-foreground">
          Запись заблокирована, чтобы не перезаписать данные, которые не удалось прочитать.
        </p>
      {/if}
      <button
        class="h-10 rounded-md border px-4 text-sm font-medium"
        type="button"
        onclick={downloadRawStorage}
      >
        Скачать исходное значение
      </button>
      <details class="text-sm text-muted-foreground">
        <summary>Технические подробности</summary>
        <p class="mt-1 break-words">{storageErrorDetails}</p>
      </details>
      {#if rawDownloadError}
        <p class="text-sm text-destructive">{rawDownloadError}</p>
      {/if}
    </section>
  {:else if services}
    {@render children()}
    <p class="sr-only" role="status" aria-live="polite">{persistenceStatus}</p>
  {:else}
    <p class="m-auto text-sm text-muted-foreground">Загрузка данных…</p>
  {/if}
</main>

{#await import('./ReloadPrompt.svelte') then { default: ReloadPrompt }}
  <ReloadPrompt />
{/await}
