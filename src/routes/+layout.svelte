<script lang="ts">
  // @ts-expect-error Виртуальный плагин
  import { pwaInfo } from 'virtual:pwa-info';

  import { ModeWatcher } from 'mode-watcher';

  import './app.css';

  const webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

  let { children } = $props();
</script>

<svelte:head>
  {@html webManifestLink}
</svelte:head>

<ModeWatcher />
<main
  class="flex h-dvh w-dvw flex-col items-center
  justify-between p-6 pb-[env(safe-area-inset-bottom)]"
>
  {@render children()}
</main>

{#await import('./ReloadPrompt.svelte') then { default: ReloadPrompt }}
  <ReloadPrompt />
{/await}
