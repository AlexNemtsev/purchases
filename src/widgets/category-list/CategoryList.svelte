<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  import { CategoryBadge } from '../../entities/category';
  import type { Category } from '../../entities/category';
  import EmptyState from '../../shared/ui/EmptyState.svelte';

  interface Props {
    categories: readonly Category[];
    showArchived: boolean;
    onEdit: (category: Category) => void;
    onArchive: (category: Category) => void;
    onRestore: (category: Category) => void;
  }

  let { categories, showArchived, onEdit, onArchive, onRestore }: Props = $props();
  const visibleCategories = $derived(
    categories.filter((category) => showArchived || !category.archived)
  );
</script>

{#if visibleCategories.length === 0}
  <EmptyState
    title={showArchived ? 'Категорий пока нет' : 'Нет активных категорий'}
    description="Добавьте категорию, чтобы назначать её операциям."
  />
{:else}
  {#each visibleCategories as category (category.id)}
    <article class="flex items-center justify-between gap-3 rounded-lg border p-4">
      <div class="min-w-0">
        <CategoryBadge {category} />
        {#if category.comment}
          <p class="mt-1 text-sm break-words text-muted-foreground">{category.comment}</p>
        {/if}
      </div>
      <div class="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" onclick={() => onEdit(category)}>Изменить</Button>
        {#if category.archived}
          <Button variant="outline" size="sm" onclick={() => onRestore(category)}>Вернуть</Button>
        {:else}
          <Button variant="outline" size="sm" onclick={() => onArchive(category)}>В архив</Button>
        {/if}
      </div>
    </article>
  {/each}
{/if}
