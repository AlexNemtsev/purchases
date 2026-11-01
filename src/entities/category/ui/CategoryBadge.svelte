<script lang="ts">
  import type { Category } from '../model';

  interface Props {
    category: Category;
  }

  let { category }: Props = $props();
</script>

<span
  class={category.archived
    ? 'inline-flex rounded-full bg-muted px-2 py-0.5 text-sm text-muted-foreground'
    : 'inline-flex rounded-full bg-secondary px-2 py-0.5 text-sm'}
>
  {category.title}
</span>
