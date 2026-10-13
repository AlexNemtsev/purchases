<script lang="ts">
  import { ModeWatcher } from 'mode-watcher';
  // @ts-expect-error Виртуальный плагин
  import { pwaInfo } from 'virtual:pwa-info';
  import './app.css';

  const webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

  let { children } = $props();
</script>

<svelte:head>
  {@html webManifestLink}
</svelte:head>

<ModeWatcher />
<div class="h-dvh w-dvw bg-muted p-6">
  <div class="flex flex-col justify-between gap-2">
    {@render children()}
  </div>
</div>

{#await import('./ReloadPrompt.svelte') then { default: ReloadPrompt }}
  <ReloadPrompt />
{/await}
