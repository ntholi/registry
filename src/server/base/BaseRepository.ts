import { db } from '@/db';
import { count, eq, like, or, sql } from 'drizzle-orm';
import { SQLiteTable, SQLiteColumn } from 'drizzle-orm/sqlite-core';

type ModelInsert<T extends SQLiteTable> = T['$inferInsert'];
type ModelSelect<T extends SQLiteTable> = T['$inferSelect'];

export interface OrderBy<T extends SQLiteTable> {
  field: keyof ModelSelect<T>;
  direction?: 'asc' | 'desc';
}

export interface FindAllParams<T extends SQLiteTable> {
  page?: number;
  search?: string;
  searchProperties?: (keyof ModelSelect<T>)[];
  orderBy?: OrderBy<T>[];
  pageSize?: number;
}

class BaseRepository<
  T extends SQLiteTable,
  PK extends keyof T & keyof ModelSelect<T>,
> {
  constructor(
    private table: T,
    private primaryKey: PK,
  ) {}

  async findFirst(): Promise<ModelSelect<T> | undefined> {
    return await db
      .select()
      .from(this.table)
      .limit(1)
      .then(([result]) => result);
  }

  async findById(id: ModelSelect<T>[PK]): Promise<ModelSelect<T> | undefined> {
    const [result] = await db
      .select()
      .from(this.table)
      .where(eq(this.table[this.primaryKey] as SQLiteColumn, id))
      .limit(1);
    return result;
  }

  async getAll(limit?: number): Promise<ModelSelect<T>[]> {
    if (limit) {
      return await db.select().from(this.table).limit(limit);
    }
    return await db.select().from(this.table);
  }

  async findAll(
    params: FindAllParams<T>,
  ): Promise<{ items: ModelSelect<T>[]; pages: number }> {
    const {
      page = 1,
      search,
      searchProperties = [],
      orderBy = [],
      pageSize = 15,
    } = params;

    const offset = (page - 1) * pageSize;

    let orderByExpressions = orderBy.map((order) => {
      const column = this.table[order.field] as SQLiteColumn;
      return sql`${column} ${order.direction === 'desc' ? sql`DESC` : sql`ASC`}`;
    });

    if (orderByExpressions.length === 0 && 'createdAt' in this.table) {
      orderByExpressions = [sql`${this.table.createdAt} DESC`];
    }

    const data = await db
      .select()
      .from(this.table)
      .where(
        or(
          ...searchProperties.map((property) =>
            like(
              this.table[property as keyof T] as SQLiteColumn,
              `%${search}%`,
            ),
          ),
        ),
      )
      .orderBy(...orderByExpressions)
      .limit(pageSize)
      .offset(offset);

    const totalCount = await this.count();
    return {
      items: data,
      pages: Math.ceil(totalCount / pageSize),
    };
  }

  async exists(id: ModelSelect<T>[PK]): Promise<boolean> {
    const [result] = await db
      .select({ count: count() })
      .from(this.table)
      .where(eq(this.table[this.primaryKey] as SQLiteColumn, id))
      .limit(1);
    return result?.count > 0;
  }

  async create(data: ModelInsert<T>): Promise<ModelSelect<T>> {
    const [inserted] = await db.insert(this.table).values(data).returning();
    return inserted;
  }

  async update(
    id: ModelSelect<T>[PK],
    data: Partial<ModelInsert<T>>,
  ): Promise<ModelSelect<T>> {
    const [updated] = (await db
      .update(this.table)
      .set(data)
      .where(eq(this.table[this.primaryKey] as SQLiteColumn, id))
      .returning()) as ModelSelect<T>[];
    return updated;
  }

  async delete(id: ModelSelect<T>[PK]): Promise<void> {
    await db
      .delete(this.table)
      .where(eq(this.table[this.primaryKey] as SQLiteColumn, id));
  }

  async count(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(this.table);
    return result?.count ?? 0;
  }

  async deleteAll(): Promise<void> {
    await db.delete(this.table);
  }
}

export default BaseRepository;
