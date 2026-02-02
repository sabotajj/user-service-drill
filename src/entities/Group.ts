import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from './User';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  status!: string;

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
