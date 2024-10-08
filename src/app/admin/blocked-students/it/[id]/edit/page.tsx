import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '@admin/blocked-students/Form';
import {
  getBlockedStudent,
  updateBlockedStudent,
} from '@admin/blocked-students/actions';

type Props = {
  params: {
    id: string;
  };
};

export default async function EditPage({ params: { id } }: Props) {
  const item = await getBlockedStudent(id, 'it');
  if (!item) return notFound();

  return (
    <Box p={'lg'}>
      <Form
        value={item}
        onSubmit={async (value) => {
          'use server';
          return await updateBlockedStudent(id, value);
        }}
      />
    </Box>
  );
}
