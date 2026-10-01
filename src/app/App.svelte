<script lang="ts">
  import { ModeWatcher } from 'mode-watcher';

  import ReloadPrompt from './ui/ReloadPrompt.svelte';
  import ThemeSwitcher from './ui/ThemeSwitcher.svelte';
</script>

<ModeWatcher />
<p>проверка рендера</p>
<ThemeSwitcher />
<ReloadPrompt />
