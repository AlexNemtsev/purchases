<script>
  import { getAppContext } from '@/app';
  import { ExportJsonButton } from '@/features/export-json';
  import PageHeader from '@/shared/ui/PageHeader.svelte';
  import PageLayout from '@/shared/ui/PageLayout.svelte';

  import ThemeSwitcher from './ThemeSwitcher.svelte';
  import CashbackCalculator from './ui/CashbackCalculator.svelte';

  const appContext = getAppContext();
  const getDocument = async () => {
    const documentStore = appContext.current?.documentStore;

    if (!documentStore) {
      throw new Error('Хранилище ещё не готово.');
    }

    return documentStore.getDocument();
  };
</script>

<svelte:head>
  <title>Разное</title>
</svelte:head>

<PageHeader>Разное</PageHeader>

<PageLayout showNavigation>
  <ThemeSwitcher />
  <ExportJsonButton {getDocument} />
  <CashbackCalculator />
</PageLayout>
