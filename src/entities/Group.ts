import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from './User';

export enum GroupStatus {
  EMPTY = 'empty',
  NOT_EMPTY = 'notEmpty'
}

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: GroupStatus,
    default: GroupStatus.NOT_EMPTY
  })
  status!: GroupStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToMany(() => User, (user) => user.groups)
  @JoinTable({
    name: 'user_groups',
    joinColumn: { name: 'group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
  })
  users!: User[];
}
