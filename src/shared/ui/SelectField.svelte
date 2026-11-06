<script lang="ts">
  import * as Select from '$lib/components/ui/select';

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    id: string;
    value: string;
    options: readonly Option[];
    placeholder?: string;
    onValueChange?: (value: string) => void;
  }

  let {
    id,
    value = $bindable(),
    options,
    placeholder = 'Выберите',
    onValueChange,
  }: Props = $props();
  const selectedLabel = $derived(options.find((option) => option.value === value)?.label);
</script>

<Select.Root
  type="single"
  {value}
  onValueChange={(next) => {
    value = next;
    onValueChange?.(next);
  }}
>
  <!-- Открытый список ставит focus-scope диалога на паузу, и фокус триггера не запоминается.
       Фокусируем триггер до открытия, иначе диалог вернёт фокус на прежний элемент. -->
  <Select.Trigger
    {id}
    class="w-full"
    data-placeholder={value === '' ? '' : undefined}
    onpointerdown={(event) => event.currentTarget.focus()}
  >
    {selectedLabel ?? placeholder}
  </Select.Trigger>
  <Select.Content>
    {#each options as option (option.value)}
      <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
