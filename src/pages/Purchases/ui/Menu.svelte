<script lang="ts">
  import { MenuIcon } from '@lucide/svelte';

  import { buttonVariants } from '$lib/components/ui/button';
  import * as Drawer from '$lib/components/ui/drawer';
  import * as NavigationMenu from '$lib/components/ui/navigation-menu';

  import ThemeSwitcher from './ThemeSwitcher.svelte';

  interface Props {
    class?: string;
  }

  let { class: className }: Props = $props();
</script>

<Drawer.Root direction="bottom">
  <Drawer.Trigger class={className}>
    <MenuIcon />
  </Drawer.Trigger>
  <Drawer.Content>
    <Drawer.Header class="flex flex-row justify-end">
      <ThemeSwitcher />
    </Drawer.Header>
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Link class="text-lg">Категории</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
    <Drawer.Footer>
      <Drawer.Close class={[buttonVariants({ size: 'lg' })]}>Закрыть</Drawer.Close>
    </Drawer.Footer>
  </Drawer.Content>
</Drawer.Root>
