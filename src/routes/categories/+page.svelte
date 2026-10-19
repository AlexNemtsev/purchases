<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';

  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { CategoriesStore } from '@/entities/category/store.svelte';
  import PageHeader from '@/shared/ui/PageHeader.svelte';

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

<div class="flex min-h-0 flex-1 flex-col justify-between gap-2 pb-2">
  <ScrollArea class="min-h-0 flex-1">
    <div class="flex h-max flex-col gap-2 p-1">
      {#each categories.categories as category (category.id)}
        <CategoryCard
          title={category.title}
          comment={category.comment}
          onContextClick={() => modalStore.onCardClick(category)}
          onDelete={() => categories.removeCategory(category.id)}
        />
      {/each}
    </div>
  </ScrollArea>
  <Button
    class="h-16 w-16 self-end rounded-full"
    variant="default"
    aria-label="Добавить"
    onclick={modalStore.onAddButtonClick}
  >
    <PlusIcon class="size-6" />
  </Button>
</div>

<CategoryModal {modalStore} />
