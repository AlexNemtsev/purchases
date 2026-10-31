<script>
  import PageHeader from '@/shared/ui/PageHeader.svelte';
  import PageLayout from '@/shared/ui/PageLayout.svelte';

  import PurchaseCard from './ui/PurchaseCard.svelte';
</script>

<svelte:head>
  <title>Закупки</title>
</svelte:head>

<PageHeader>Закупки</PageHeader>

<PageLayout showNavigation>
  <PurchaseCard />
</PageLayout>
