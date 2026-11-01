<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { CategoryBadge } from '@/entities/category';
  import type { Category } from '@/entities/category';
  import ActionsMenu from '@/shared/ui/ActionsMenu.svelte';
  import EmptyState from '@/shared/ui/EmptyState.svelte';

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
    <Card.Root size="sm">
      <Card.Content class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <CategoryBadge {category} />
          {#if category.comment}
            <p class="mt-1 text-sm break-words text-muted-foreground">{category.comment}</p>
          {/if}
        </div>
        <ActionsMenu
          label={`Действия: ${category.title}`}
          actions={[
            { label: 'Изменить', onSelect: () => onEdit(category) },
            category.archived
              ? { label: 'Вернуть из архива', onSelect: () => onRestore(category) }
              : { label: 'В архив', onSelect: () => onArchive(category) },
          ]}
        />
      </Card.Content>
    </Card.Root>
  {/each}
{/if}
