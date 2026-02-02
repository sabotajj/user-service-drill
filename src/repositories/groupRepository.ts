import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Group as GroupEntity } from '../entities';
import { Group } from '../types';

export interface IGroupRepository {
  findAll(limit: number, offset: number): Promise<{ groups: Group[]; total: number }>;
  removeUserFromGroup(userId: number, groupId: number, queryRunner: QueryRunner): Promise<boolean>;
  getGroupMemberCount(groupId: number, queryRunner: QueryRunner): Promise<number>;
  updateGroupStatus(groupId: number, status: string, queryRunner: QueryRunner): Promise<void>;
  getQueryRunner(): Promise<QueryRunner>;
}

export class GroupRepository implements IGroupRepository {
  private repository: Repository<GroupEntity>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(GroupEntity);
  }

  async getQueryRunner(): Promise<QueryRunner> {
    return this.dataSource.createQueryRunner();
  }

  async findAll(limit: number, offset: number): Promise<{ groups: Group[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const groups: Group[] = entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      description: '',
      status: entity.status,
      createdAt: entity.createdAt
    }));

    return { groups, total };
  }

  async removeUserFromGroup(userId: number, groupId: number, queryRunner: QueryRunner): Promise<boolean> {
    const result = await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from('user_groups')
      .where('user_id = :userId AND group_id = :groupId', { userId, groupId })
      .execute();
    
    return (result.affected || 0) > 0;
  }

  async getGroupMemberCount(groupId: number, queryRunner: QueryRunner): Promise<number> {
    const result = await queryRunner.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('user_groups', 'ug')
      .where('ug.group_id = :groupId', { groupId })
      .getRawOne();
    
    return parseInt(result?.count || '0');
  }

  async updateGroupStatus(groupId: number, status: string, queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .update(GroupEntity)
      .set({ status })
      .where('id = :groupId', { groupId })
      .execute();
  }
}
