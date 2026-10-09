<script lang="ts">
  import { ModeWatcher } from 'mode-watcher';

  import { Purchases } from '@/pages/Purchases';

  import ReloadPrompt from './ui/ReloadPrompt.svelte';
</script>

<ModeWatcher />
<div class="h-dvh w-dvw bg-muted p-6">
  <div class="flex flex-col justify-between gap-2">
    <Purchases />
  </div>
</div>
<ReloadPrompt />
