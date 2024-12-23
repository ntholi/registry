'use server';

import { auth } from '@/auth';
import db from '@/db';
import {
  blockedStudents,
  clearanceRequest,
  students,
  clearanceResponse,
  financePayments,
} from '@/db/schema';
import {
  and,
  count,
  desc,
  eq,
  like,
  inArray,
  not,
  sql,
  or,
  isNull,
} from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type ClearanceRequest = typeof clearanceRequest.$inferSelect;
export type ClearanceResponse = typeof clearanceResponse.$inferSelect;
export type Responder = ClearanceResponse['responder'];

const ITEMS_PER_PAGE = 15;

export async function getClearanceList(
  responder: Responder,
  page: number = 1,
  search = '',
) {
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const sq = db
    .select({ id: clearanceResponse.clearanceRequestId })
    .from(clearanceResponse)
    .where(eq(clearanceResponse.responder, responder));

  const list = await db
    .select({
      id: clearanceRequest.id,
      stdNo: clearanceRequest.stdNo,
      student: {
        name: students.name,
      },
    })
    .from(clearanceRequest)
    .where(
      and(
        like(clearanceRequest.stdNo, `%${search}%`),
        not(inArray(clearanceRequest.id, sq)),
      ),
    )
    .leftJoin(students, eq(students.stdNo, clearanceRequest.stdNo))
    .orderBy(clearanceRequest.createdAt)
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  // Update total count query
  const totalCount = await db
    .select({ count: count() })
    .from(clearanceRequest)
    .where(not(inArray(clearanceRequest.id, sq)))
    .then((it) => it[0].count);

  return {
    items: list.map((it) => ({
      ...it,
    })),
    pages: Math.ceil(totalCount / ITEMS_PER_PAGE),
  };
}

export async function getUnattendedRequestsCount(responder: Responder) {
  const validResponders = ['finance', 'library', 'resource', 'it'];
  if (!validResponders.includes(responder)) {
    return 0;
  }
  const sq = db
    .select({ id: clearanceResponse.clearanceRequestId })
    .from(clearanceResponse)
    .where(eq(clearanceResponse.responder, responder));
  const number = await db
    .select({ count: count() })
    .from(clearanceRequest)
    .where(not(inArray(clearanceRequest.id, sq)));
  return number[0].count;
}

export async function getRequest(stdNo: string, responder: Responder) {
  const res = await db
    .select({
      id: clearanceRequest.id,
      stdNo: clearanceRequest.stdNo,
      student: {
        name: students.name,
        program: students.program,
      },
      blockedStudent: {
        reason: blockedStudents.reason,
      },
      createdAt: clearanceRequest.createdAt,
    })
    .from(clearanceRequest)
    .where(eq(clearanceRequest.stdNo, stdNo))
    .leftJoin(students, eq(students.stdNo, clearanceRequest.stdNo))
    .leftJoin(
      blockedStudents,
      and(
        eq(students.stdNo, blockedStudents.stdNo),
        eq(blockedStudents.department, responder),
      ),
    )
    .then((it) => it[0]);

  return res;
}

export async function respondToRequest(
  stdNo: string,
  clearanceRequestId: number,
  response: {
    responder: Responder;
    status: 'cleared' | 'blocked';
    reasonBlocked?: string | null;
  },
): Promise<void> {
  const session = await auth();
  if (!session || !session.user?.id) {
    throw new Error('Unauthorized');
  }
  if (response.status === 'blocked') {
    const blockedStudent = await db
      .insert(blockedStudents)
      .values({
        stdNo,
        reason: response.reasonBlocked,
        department: response.responder,
        createdBy: session.user.id,
      })
      .returning()
      .then((it) => it[0]);
    await db.insert(clearanceResponse).values({
      clearanceRequestId,
      responder: response.responder,
      blockedStudentId: blockedStudent.id,
      createdBy: session.user.id,
    });
  } else {
    await db.insert(clearanceResponse).values({
      clearanceRequestId,
      responder: response.responder,
      createdBy: session.user.id,
    });
  }
  revalidatePath(`/admin/clearance-requests/${stdNo}`);
  revalidatePath('/admin/blocked-students');
}

export async function getClearedStudentNumbers() {
  const list = await db
    .select({
      stdNo: clearanceRequest.stdNo,
    })
    .from(clearanceResponse)
    .where(
      and(
        eq(clearanceResponse.responder, 'finance'),
        or(isNull(blockedStudents.id), eq(blockedStudents.status, 'unblocked')),
      ),
    )
    .leftJoin(
      clearanceRequest,
      eq(clearanceRequest.id, clearanceResponse.clearanceRequestId),
    )
    .leftJoin(students, eq(students.stdNo, clearanceRequest.stdNo))
    .leftJoin(
      blockedStudents,
      and(
        eq(blockedStudents.stdNo, clearanceRequest.stdNo),
        eq(blockedStudents.department, 'finance'),
      ),
    )
    .orderBy(students.program, students.name);

  return list.map((item) => item.stdNo);
}
