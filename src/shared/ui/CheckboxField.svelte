<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';

  interface Props {
    id: string;
    label: string;
    checked: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }

  let { id, label, checked = $bindable(), onCheckedChange }: Props = $props();
</script>

<div class="flex items-center gap-2">
  <Checkbox {id} bind:checked {onCheckedChange} />
  <Label for={id}>{label}</Label>
</div>
