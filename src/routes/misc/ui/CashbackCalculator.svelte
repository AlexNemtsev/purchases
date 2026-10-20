<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';

  let cashbackPercent = $state<number | undefined>(undefined);
  let cashbackAmount = $state<number | undefined>(undefined);
  let purchaseAmount = $derived(
    cashbackPercent && cashbackAmount ? ((cashbackAmount * 100) / cashbackPercent).toFixed(2) : 0
  );
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="text-lg">Максимальная стоимость покупки</Card.Title>
  </Card.Header>
  <Card.Content class="grid grid-cols-2 gap-4">
    <Field.Field>
      <Field.Label class="text-base" for="cashback-percent">Кэшбек, %</Field.Label>
      <Input id="cashback-percent" type="number" inputmode="decimal" bind:value={cashbackPercent} />
    </Field.Field>
    <Field.Field>
      <Field.Label class="text-base" for="cashback-amount">Кэшбек, руб</Field.Label>
      <Input id="cashback-amount" type="number" inputmode="decimal" bind:value={cashbackAmount} />
    </Field.Field>
    <Field.Field class="col-span-2">
      <Field.Label class="text-base" for="purchase-amount">Сумма покупки, руб</Field.Label>
      <Input
        id="purchase-amount"
        type="number"
        inputmode="decimal"
        bind:value={purchaseAmount}
        disabled
      />
    </Field.Field>
  </Card.Content>
</Card.Root>
