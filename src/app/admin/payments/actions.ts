'use server';

import { eq, like, desc } from 'drizzle-orm';
import db from '@/db';
import { financePayments, students } from '@/db/schema';
import { revalidatePath } from 'next/cache';

const ITEMS_PER_PAGE = 15;

export async function getPayments(page: number = 1, search = '') {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const list = await db
    .select({
      id: financePayments.id,
      stdNo: financePayments.stdNo,
      name: students.name,
      amount: financePayments.amount,
      receiptNo: financePayments.receiptNo,
      item: financePayments.item,
      createdAt: financePayments.createdAt,
    })
    .from(financePayments)
    .where(like(financePayments.stdNo, `%${search}%`))
    .leftJoin(students, eq(financePayments.stdNo, students.stdNo))
    .orderBy(desc(financePayments.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);
  return {
    items: list,
    pages: Math.ceil(list.length / ITEMS_PER_PAGE),
  };
}

export async function getPaymentForStudent(stdNo: string) {
  return await db
    .select({
      amount: financePayments.amount,
      receiptNo: financePayments.receiptNo,
      item: financePayments.item,
    })
    .from(financePayments)
    .where(eq(financePayments.stdNo, stdNo));
}

export async function createPayment(data: typeof financePayments.$inferInsert) {
  const res = await db.insert(financePayments).values(data).returning();
  revalidatePath('/admin/payments');
  return res[0];
}

export async function deletePayment(id: number) {
  await db.delete(financePayments).where(eq(financePayments.id, id));
  revalidatePath('/admin/payments');
}

export async function importPayments(
  payments: (typeof financePayments.$inferInsert)[],
) {
  await db.insert(financePayments).values(payments).onConflictDoNothing();
  revalidatePath('/admin/payments');
}
