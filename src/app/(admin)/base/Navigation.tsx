import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Divider,
  Flex,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconChevronRight,
  IconFileDescription,
  IconLogout2,
} from '@tabler/icons-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React from 'react';
import { modals } from '@mantine/modals';

export default function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <AppShell.Navbar p='xs'>
      <AppShell.Section grow component={ScrollArea}>
        {/* <NavLink
          label='Requisitions'
          component={Link}
          active={pathname.startsWith('/admin/requisitions')}
          href={'/admin/requisitions'}
          leftSection={<IconFileDescription size='1.1rem' />}
          rightSection={<IconChevronRight size='0.8rem' stroke={1.5} />}
        /> */}
        <NavLink
          label='Student Cards'
          component={Link}
          active={pathname.startsWith('/admin/student-cards')}
          href={'/admin/student-cards'}
          leftSection={<IconFileDescription size='1.1rem' />}
          rightSection={<IconChevronRight size='0.8rem' stroke={1.5} />}
        />
      </AppShell.Section>
      <AppShell.Section>
        <Divider />
        <UserButton />
      </AppShell.Section>
    </AppShell.Navbar>
  );
}

function UserButton() {
  const { data: session } = useSession();

  const openModal = () =>
    modals.openConfirmModal({
      centered: true,
      title: 'Confirm logout',
      children: 'Are you sure you want to logout?',
      confirmProps: { color: 'dark' },
      labels: { confirm: 'Logout', cancel: 'Cancel' },
      onConfirm: () => signOut(),
    });

  return (
    <Flex mt={'md'} mb={'sm'} justify='space-between' align={'center'}>
      <Group>
        <Avatar src={session?.user?.image} />
        <Stack gap={5}>
          <Text size='0.9rem'>{session?.user?.name}</Text>
          <Text size='0.7rem' c={'dimmed'}>
            {session?.user?.email}
          </Text>
        </Stack>
      </Group>
      <ActionIcon variant='default' size={'lg'}>
        <IconLogout2 size='1rem' onClick={openModal} />
      </ActionIcon>
    </Flex>
  );
}
