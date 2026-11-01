<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    description?: string;
    action?: Snippet;
  }

  let { title, description, action }: Props = $props();
</script>

<div class="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
  <p class="font-medium">{title}</p>
  {#if description}
    <p class="text-sm text-muted-foreground">{description}</p>
  {/if}
  {#if action}
    {@render action()}
  {/if}
</div>
