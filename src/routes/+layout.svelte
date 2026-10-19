<script lang="ts">
  // @ts-expect-error Виртуальный плагин
  import { pwaInfo } from 'virtual:pwa-info';

  import { ModeWatcher } from 'mode-watcher';

  import './app.css';
  import NavMenu from './ui/NavMenu.svelte';

  const webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

  let { children } = $props();
</script>

<svelte:head>
  {@html webManifestLink}
</svelte:head>

<ModeWatcher />
<main
  class="flex h-dvh w-dvw flex-col items-center justify-between p-6 pb-[env(safe-area-inset-bottom)]"
>
  <div class="flex h-full min-h-0 w-full flex-col gap-2">
    {@render children()}
  </div>

  <NavMenu />
</main>

{#await import('./ReloadPrompt.svelte') then { default: ReloadPrompt }}
  <ReloadPrompt />
{/await}
