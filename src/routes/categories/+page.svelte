<script lang="ts">
  import { CategoriesStore } from '@/entities/category/store.svelte';
  import PageHeader from '@/shared/ui/PageHeader.svelte';
  import PageLayout from '@/shared/ui/PageLayout.svelte';

  import { ModalStore } from './lib/ModalStore.svelte';
  import CategoryCard from './ui/CategoryCard.svelte';
  import CategoryModal from './ui/CategoryModal.svelte';

  let categories = new CategoriesStore();
  let modalStore = new ModalStore(categories);
</script>

<svelte:head>
  <title>Категории</title>
</svelte:head>

<PageHeader>Категории</PageHeader>

<PageLayout onAdd={modalStore.onAddButtonClick} showNavigation>
  {#each categories.categories as category (category.id)}
    <CategoryCard
      title={category.title}
      comment={category.comment}
      onContextClick={() => modalStore.onCardClick(category)}
      onDelete={() => categories.removeCategory(category.id)}
    />
  {/each}
</PageLayout>

<CategoryModal {modalStore} />
