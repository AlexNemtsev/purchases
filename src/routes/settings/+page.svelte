<script>
  import PageHeader from '@/shared/ui/PageHeader.svelte';
  import PageLayout from '@/shared/ui/PageLayout.svelte';

  import ThemeSwitcher from './ThemeSwitcher.svelte';
</script>

<svelte:head>
  <title>Настройки</title>
</svelte:head>

<PageHeader>Настройки</PageHeader>

<PageLayout showNavigation>
  <ThemeSwitcher />
</PageLayout>
