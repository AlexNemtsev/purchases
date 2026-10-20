<script>
  import PageHeader from '@/shared/ui/PageHeader.svelte';
  import PageLayout from '@/shared/ui/PageLayout.svelte';

  import ThemeSwitcher from './ThemeSwitcher.svelte';
  import CashbackCalculator from './ui/CashbackCalculator.svelte';
</script>

<svelte:head>
  <title>Разное</title>
</svelte:head>

<PageHeader>Разное</PageHeader>

<PageLayout showNavigation>
  <ThemeSwitcher />
  <CashbackCalculator />
</PageLayout>
