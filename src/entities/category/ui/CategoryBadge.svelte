<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';

  import type { Category } from '../model';

  interface Props {
    category: Category;
  }

  let { category }: Props = $props();
</script>

<Badge variant={category.archived ? 'outline' : 'secondary'} class="h-auto text-sm">
  {category.title}
</Badge>
