<script lang="ts">
  import MoneyInput from './MoneyInput.svelte';
  import PermilleInput from './PermilleInput.svelte';
  import { MAX_AMOUNT_KOPECKS, MAX_PERMILLE } from '../config';
  import { formatMoney, formatPermille, parseMoney, parsePermille, roundDiv } from '../lib/money';

  interface Props {
    id: string;
    label: string;
    mode: 'amount' | 'percent';
    value: number;
    base: number;
    error?: string;
    onValidityChange?: (valid: boolean) => void;
    onChange: (mode: 'amount' | 'percent', value: number) => void;
  }

  let { id, label, mode, value, base, error, onValidityChange, onChange }: Props = $props();
  let text = $state('');
  let conversionError = $state('');

  $effect(() => {
    text =
      mode === 'amount'
        ? formatMoney(value).replace(/ ₽$/u, '')
        : formatPermille(value).replace(/ %$/u, '');

    onValidityChange?.(true);
  });

  const handleValueChange = (nextText: string) => {
    text = nextText;

    if (mode === 'amount') {
      const parsed = parseMoney(nextText);

      if (parsed !== null) {
        conversionError = '';
        onValidityChange?.(true);
        onChange(mode, parsed);
      } else {
        onValidityChange?.(false);
      }

      return;
    }

    const parsed = parsePermille(nextText);

    if (parsed !== null) {
      conversionError = '';
      onValidityChange?.(true);
      onChange(mode, parsed);
    } else {
      onValidityChange?.(false);
    }
  };

  const switchMode = (nextMode: 'amount' | 'percent') => {
    if (nextMode === mode) {
      return;
    }

    let converted: number;

    if (nextMode === 'percent') {
      converted =
        base === 0 ? 0 : Math.max(0, Number(roundDiv(BigInt(value) * 1000n, BigInt(base))));

      if (converted > MAX_PERMILLE) {
        conversionError = 'Эквивалент превышает допустимый процент.';
        onValidityChange?.(false);

        return;
      }
    } else {
      converted = Math.max(0, Number(roundDiv(BigInt(base) * BigInt(value), 1000n)));

      if (converted > MAX_AMOUNT_KOPECKS) {
        conversionError = 'Эквивалент превышает допустимую сумму.';
        onValidityChange?.(false);

        return;
      }
    }

    conversionError = '';
    onValidityChange?.(true);
    onChange(nextMode, converted);
  };

  const equivalent = $derived.by(() => {
    if (mode === 'amount') {
      if (base === 0) {
        return '—';
      }

      return formatPermille(Number(roundDiv(BigInt(value) * 1000n, BigInt(base))));
    }

    return formatMoney(Number(roundDiv(BigInt(base) * BigInt(value), 1000n)));
  });
</script>

<div class="flex flex-col gap-2">
  <label class="text-sm font-medium" for={`${id}-mode`}>{label}</label>
  <select
    id={`${id}-mode`}
    class="h-10 rounded-md border bg-background px-3 text-sm"
    value={mode}
    onchange={(event) => switchMode(event.currentTarget.value as 'amount' | 'percent')}
  >
    <option value="amount">Сумма</option>
    <option value="percent">Процент</option>
  </select>
  <p class="text-xs text-muted-foreground">Эквивалент: {equivalent}</p>
  {#if mode === 'amount'}
    <MoneyInput
      id={`${id}-value`}
      label="Сумма скидки"
      value={text}
      error={conversionError || error}
      onValueChange={handleValueChange}
    />
  {:else}
    <PermilleInput
      id={`${id}-value`}
      label="Скидка, %"
      value={text}
      error={conversionError || error}
      onValueChange={handleValueChange}
    />
  {/if}
</div>
