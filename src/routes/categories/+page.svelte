<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { getAppContext } from '@/app';
  import type { Category } from '@/entities/category';
  import { CategoryEditor } from '@/features/manage-categories';
  import EmptyState from '@/shared/ui/EmptyState.svelte';
  import PageHeader from '@/shared/ui/PageHeader.svelte';
  import PageLayout from '@/shared/ui/PageLayout.svelte';
  import { CategoryList } from '@/widgets/category-list';

  const appContext = getAppContext();
  const app = $derived(appContext.current);
  let showArchived = $state(false);
  let editorOpen = $state(false);
  let editingCategory = $state<Category | undefined>();
  let actionError = $state('');

  const openNewCategory = () => {
    editingCategory = undefined;
    editorOpen = true;
  };

  const openEditor = (category: Category) => {
    editingCategory = category;
    editorOpen = true;
  };

  const saveCategory = async (category: Category) => {
    if (!app) {
      throw new Error('Хранилище ещё не готово.');
    }

    if (editingCategory) {
      await app.categories.update(category);
    } else {
      await app.categories.add(category);
    }
  };

  const archive = async (category: Category) => {
    actionError = '';

    try {
      if (!app) {
        throw new Error('Хранилище ещё не готово.');
      }

      await app.categories.archive(category.id);
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Не удалось архивировать категорию.';
    }
  };

  const restore = async (category: Category) => {
    actionError = '';

    try {
      if (!app) {
        throw new Error('Хранилище ещё не готово.');
      }

      await app.categories.restore(category.id);
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Не удалось восстановить категорию.';
    }
  };
</script>

<svelte:head>
  <title>Категории</title>
</svelte:head>

<PageHeader>Категории</PageHeader>

<PageLayout showNavigation>
  {#if app}
    <div class="flex items-center justify-between gap-3">
      <label class="flex items-center gap-2 text-sm" for="show-archived">
        <input id="show-archived" bind:checked={showArchived} type="checkbox" class="size-4" />
        Показывать архивные
      </label>
      <Button onclick={openNewCategory}>Добавить</Button>
    </div>
    {#if actionError}
      <p class="text-sm text-destructive" role="alert">{actionError}</p>
    {/if}
    <CategoryList
      categories={app.categories.categories}
      {showArchived}
      onEdit={openEditor}
      onArchive={archive}
      onRestore={restore}
    />
    <CategoryEditor
      bind:open={editorOpen}
      category={editingCategory}
      onSave={saveCategory}
      onOpenChange={(open) => {
        editorOpen = open;
      }}
    />
  {:else}
    <EmptyState title="Загрузка категорий…" />
  {/if}
</PageLayout>
