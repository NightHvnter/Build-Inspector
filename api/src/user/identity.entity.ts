import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity.js';

// An external account (Google; later Discord, Steam) a user signs in with.
// One user can have several; each external account belongs to one user.
@Entity('UserIdentity')
@Unique(['Provider', 'ProviderUserId'])
export class UserIdentityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' })
  user: UserEntity;

  @Column()
  UserId: number;

  // 'google', 'discord' or 'steam'.
  @Column({ length: 20 })
  Provider: string;

  // The provider's own stable id for the account (Google's "sub", Discord's user id).
  @Column({ length: 255 })
  ProviderUserId: string;

  @CreateDateColumn()
  created_at: Date;
}
