'use client';

import { useViewSelect } from '@/hooks/useViewSelect';
import {
  Divider,
  Flex,
  Grid,
  GridCol,
  Group,
  Paper,
  ScrollArea,
  Stack,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { ListItem } from './ListItem';
import { Pagination } from './Pagination';
import { SearchField } from './SearchField';

export type ListLayoutProps<T> = {
  getItems: (
    page: number,
    search: string,
  ) => Promise<{ items: T[]; pages: number }>;
  renderItem: (item: T) => React.ReactNode;
  path: string;
  queryKey: string[];
  actionIcons?: React.ReactNode[];
  children: React.ReactNode;
};

export function ListLayout<T>({
  getItems,
  renderItem,
  actionIcons,
  children,
  queryKey,
  path,
}: ListLayoutProps<T>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get('q') || '';
  const page = Number(searchParams.get('page')) || 1;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [view, setView] = useViewSelect();

  const { data = { items: [], pages: 0 } } = useQuery({
    queryKey: [...queryKey, page, search],
    queryFn: () => getItems(page, search),
    staleTime: 0,
  });

  const { items, pages } = data;

  const renderListItem = (item: T) => {
    const itemElement = renderItem(item);
    if (React.isValidElement(itemElement) && itemElement.type === ListItem) {
      return React.cloneElement(
        itemElement as React.ReactElement<
          React.ComponentProps<typeof ListItem>
        >,
        {
          path,
          onClick: () => {
            if (isMobile) {
              setView('details');
            }
            const itemId = (itemElement.props as any).id;
            router.push(`${path}/${itemId}`);
          },
        },
      );
    }
    return itemElement;
  };

  if (isMobile && view === 'details') {
    return (
      <Paper withBorder>
        <ScrollArea h='88vh' type='always'>
          {children}
        </ScrollArea>
      </Paper>
    );
  }

  return (
    <Grid columns={14} gutter={'xl'}>
      <GridCol span={isMobile ? 14 : 4} pr={isMobile ? 0 : 7}>
        <Paper withBorder h={'88vh'} mr={isMobile ? 'md' : 0}>
          <Flex direction='column' h='100%'>
            <Stack p={'md'}>
              <Flex justify='space-between' align={'center'} gap={'xs'}>
                <Group style={{ width: '100%', flex: 1 }}>
                  <SearchField style={{ width: '100%' }} />
                </Group>
                {actionIcons?.map((component, index) => (
                  <React.Fragment key={index}>{component}</React.Fragment>
                ))}
              </Flex>
            </Stack>
            <Divider />
            <ScrollArea type='always' style={{ flex: 1 }} p={'sm'}>
              {items.map((item: T, index: number) => (
                <React.Fragment key={index}>
                  {renderListItem(item)}
                </React.Fragment>
              ))}
            </ScrollArea>

            <Divider />
            <Pagination total={pages} />
          </Flex>
        </Paper>
      </GridCol>

      {!isMobile && (
        <GridCol span={10}>
          <Paper withBorder>
            <ScrollArea h='88vh' type='always'>
              {children}
            </ScrollArea>
          </Paper>
        </GridCol>
      )}
    </Grid>
  );
}
