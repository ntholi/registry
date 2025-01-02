import { users } from '@/db/schema';
import UserRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';

type User = typeof users.$inferInsert;

class UserService {
  constructor(
    private readonly repository: UserRepository = new UserRepository()
  ) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: string) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async findAll(params: FindAllParams<typeof users>) {
    return withAuth(async () => this.repository.findAll(params), []);
  }

  async create(data: User) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: string, data: User) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: string) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const usersService = new UserService();
