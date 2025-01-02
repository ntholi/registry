import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';

const db = drizzle({
  connection: { url: process.env.DB_FILE_NAME! },
  casing: 'snake_case',
});

export { db };
