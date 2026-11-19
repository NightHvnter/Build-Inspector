import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity.js';

// A game a user marked as favourite. One row per user and game.
@Entity('Favorite')
@Index(['UserId', 'AppId'], { unique: true })
export class FavoriteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Deleting a user deletes their favourites.
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' })
  user: UserEntity;

  @Column()
  UserId: number;

  // Steam app id of the game.
  @Column()
  AppId: number;

  @CreateDateColumn()
  created_at: Date;
}
