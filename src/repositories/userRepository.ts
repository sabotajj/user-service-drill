import { Repository, DataSource, QueryRunner } from 'typeorm';
import { User as UserEntity } from '../entities';
import { User, UserStatusUpdate } from '../types';

export interface IUserRepository {
  findAll(limit: number, offset: number): Promise<{ users: User[]; total: number }>;
  updateUsersStatuses(updates: UserStatusUpdate[], queryRunner: QueryRunner): Promise<number>;
  getQueryRunner(): Promise<QueryRunner>;
}

export class UserRepository implements IUserRepository {
  private repository: Repository<UserEntity>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserEntity);
  }

  async getQueryRunner(): Promise<QueryRunner> {
    return this.dataSource.createQueryRunner();
  }

  async findAll(limit: number, offset: number): Promise<{ users: User[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const users: User[] = entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      email: entity.email,
      createdAt: entity.createdAt
    }));

    return { users, total };
  }

  async updateUsersStatuses(updates: UserStatusUpdate[], queryRunner: QueryRunner): Promise<number> {
    let updatedCount = 0;

    for (const update of updates) {
      const result = await queryRunner.manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({ status: update.status })
        .where('id = :userId', { userId: update.userId })
        .execute();
      
      updatedCount += result.affected || 0;
    }

    return updatedCount;
  }
}
