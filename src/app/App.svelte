<script lang="ts">
  import { ModeWatcher } from 'mode-watcher';

  import ReloadPrompt from './ui/ReloadPrompt.svelte';
  import ThemeSwitcher from './ui/ThemeSwitcher.svelte';
</script>

<ModeWatcher />
<div class="h-dvh w-dvw bg-muted p-6">
  <div class="flex flex-col justify-between gap-2">
    <p>проверка рендера</p>
    <ThemeSwitcher />
  </div>
</div>
<ReloadPrompt />
