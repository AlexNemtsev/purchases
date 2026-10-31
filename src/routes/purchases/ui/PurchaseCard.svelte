<script lang="ts">
  import * as Card from '$lib/components/ui/card';

  import { resolve } from '$app/paths';

  const purchaseSlug = '1';
</script>

<a href={resolve('/purchases/[slug]', { slug: purchaseSlug })}>
  <Card.Root class="flex flex-row justify-between">
    <Card.Header>
      <Card.Title class="text-lg">Озон</Card.Title>
      <Card.Description>20.10.2026</Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col items-end gap-1.5">
      <p class="text-lg">8000₽</p>
      <p class="text-emerald-500">-20% / 1600₽</p>
    </Card.Content>
  </Card.Root>
</a>
