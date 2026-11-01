<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  import { MAX_AMOUNT_KOPECKS } from '../config';

  interface Props {
    id: string;
    label: string;
    value: string;
    error?: string;
    onValueChange: (value: string) => void;
  }

  let { id, label, value, error, onValueChange }: Props = $props();
</script>

<div class="flex flex-col gap-2">
  <Label for={id}>{label}</Label>
  <Input
    {id}
    type="text"
    inputmode="decimal"
    autocomplete="off"
    placeholder="0,00"
    {value}
    oninput={(event) => onValueChange(event.currentTarget.value)}
    aria-invalid={Boolean(error)}
    aria-describedby={error ? `${id}-error` : undefined}
    data-max-kopecks={MAX_AMOUNT_KOPECKS}
  />
  {#if error}
    <span class="text-xs text-destructive" id={`${id}-error`}>{error}</span>
  {/if}
</div>
