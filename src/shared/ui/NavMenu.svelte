<script lang="ts">
  import type { LucideProps } from '@lucide/svelte';
  import GearIcon from '@lucide/svelte/icons/cog';
  import ListIcon from '@lucide/svelte/icons/list';
  import ReceiptRussianRuble from '@lucide/svelte/icons/receipt-russian-ruble';
  import type { Component } from 'svelte';

  import * as NavigationMenu from '$lib/components/ui/navigation-menu';

  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  interface MenuItem {
    label: string;
    href: '/' | '/categories' | '/misc' | '/purchases';
    icon: Component<LucideProps, object, ''>;
  }

  const menuItems: MenuItem[] = [
    { label: 'Закупки', href: '/purchases', icon: ReceiptRussianRuble },
    { label: 'Категории', href: '/categories', icon: ListIcon },
    { label: 'Разное', href: '/misc', icon: GearIcon },
  ];
</script>

<NavigationMenu.Root class="flex-0 justify-center border-t md:hidden">
  <NavigationMenu.List>
    {#each menuItems as item (item.href)}
      {const isActive = $derived(page.url.pathname === item.href)}
      <NavigationMenu.Item aria-current={isActive ? 'page' : undefined}>
        <NavigationMenu.Link
          class={[
            'flex flex-col',
            {
              'text-primary': isActive,
              'text-muted-foreground': !isActive,
            },
          ]}
          href={resolve(item.href)}><item.icon class="size-6" />{item.label}</NavigationMenu.Link
        >
      </NavigationMenu.Item>
    {/each}
  </NavigationMenu.List>
</NavigationMenu.Root>
