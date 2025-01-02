'use client';

import { useViewSelect } from '@/hooks/useViewSelect';
import { ActionIcon, Divider, Flex, Group, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowNarrowLeft, IconEdit } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DeleteButton } from './DeleteButton';

export interface DetailsViewHeaderProps {
  title: string;
  queryKey: string[];
  handleDelete?: () => Promise<void>;
  onDeleteSuccess?: () => Promise<void>;
}

export function DetailsViewHeader({
  title,
  queryKey,
  handleDelete,
  onDeleteSuccess,
}: DetailsViewHeaderProps) {
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [view, setView] = useViewSelect();

  return (
    <>
      <Flex justify={'space-between'} align={'center'}>
        {isMobile ? (
          <Group>
            <ActionIcon variant='default' onClick={() => setView('nav')}>
              <IconArrowNarrowLeft size={'1rem'} />
            </ActionIcon>
            <Title order={3} fw={100} size={'1.1rem'}>
              {title}
            </Title>
          </Group>
        ) : (
          <Title order={3} fw={100}>
            {title}
          </Title>
        )}
        <Group>
          {handleDelete && (
            <DeleteButton
              handleDelete={handleDelete}
              onSuccess={onDeleteSuccess}
              queryKey={queryKey}
            />
          )}
          <ActionIcon
            component={Link}
            href={`${pathname}/edit`}
            variant='outline'
          >
            <IconEdit size={'1rem'} />
          </ActionIcon>
        </Group>
      </Flex>
      <Divider my={15} />
    </>
  );
}
