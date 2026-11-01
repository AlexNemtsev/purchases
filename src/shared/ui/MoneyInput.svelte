<script lang="ts">
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

<label class="flex flex-col gap-1 text-sm font-medium" for={id}>
  {label}
  <input
    {id}
    class="h-10 rounded-md border bg-background px-3 font-normal"
    type="text"
    inputmode="decimal"
    autocomplete="off"
    placeholder="0,00"
    bind:value
    oninput={(event) => onValueChange(event.currentTarget.value)}
    aria-invalid={Boolean(error)}
    aria-describedby={error ? `${id}-error` : undefined}
    data-max-kopecks={MAX_AMOUNT_KOPECKS}
  />
  {#if error}
    <span class="text-xs font-normal text-destructive" id={`${id}-error`}>{error}</span>
  {/if}
</label>
