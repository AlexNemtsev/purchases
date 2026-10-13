<script>
  import PageHeader from '@/shared/ui/PageHeader.svelte';

  import Menu from './ui/Menu.svelte';
</script>

<svelte:head>
  <title>Закупки</title>
</svelte:head>

<div class="grid grid-cols-3">
  <PageHeader>Закупки</PageHeader>
  <Menu class="justify-self-end" />
</div>
