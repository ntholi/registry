import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import type { AdapterAccountType } from 'next-auth/adapters';

export const userRoles = ['admin', 'student'] as const;
export const users = sqliteTable('users', {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text(),
  role: text({ enum: userRoles }).notNull().default('student'),
  email: text().unique(),
  emailVerified: integer({ mode: 'timestamp_ms' }),
  image: text(),
});

export const accounts = sqliteTable(
  'accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text().$type<AdapterAccountType>().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refresh_token: text(),
    access_token: text(),
    expires_at: integer(),
    token_type: text(),
    scope: text(),
    id_token: text(),
    session_state: text(),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable('sessions', {
  sessionToken: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer({ mode: 'timestamp_ms' }).notNull(),
});

export const verificationTokens = sqliteTable(
  'verification_tokens',
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: integer({ mode: 'timestamp_ms' }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

export const authenticators = sqliteTable(
  'authenticators',
  {
    credentialID: text().notNull().unique(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text().notNull(),
    credentialPublicKey: text().notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text().notNull(),
    credentialBackedUp: integer({
      mode: 'boolean',
    }).notNull(),
    transports: text(),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
);
