'use server';

import { auth } from '@/auth';
import { users } from '@/db/schema';

type Role = (typeof users.$inferSelect)['role'] | 'all';

export default async function withAuth<T>(
  fn: () => Promise<T>,
  roles: Role[] = []
) {
  const stack = new Error().stack;
  const callerLine = stack?.split('\n')[2] || '';
  const methodMatch = callerLine.match(/at\s+(.*?)\s+\(/);

  const method = methodMatch ? methodMatch[1] : 'unknown method';

  if (roles.includes('all')) {
    return fn();
  }
  const session = await auth();

  if (!session?.user) {
    console.error(`Auth Error caused by ${method}`);
    throw new Error('Unauthorized - Please sign in');
  }

  if (
    roles.length > 0 &&
    !['admin', ...roles].includes(session.user.role as Role)
  ) {
    console.error(`Permission Error caused by ${method}`);
    throw new Error('Unauthorized - Insufficient permissions');
  }

  return fn();
}
