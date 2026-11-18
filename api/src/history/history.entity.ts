import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity.js';

// One "Confronta con il mio PC" result: a game's minimum requirements against a user's PC.
@Entity('ComparisonHistory')
@Index(['UserId', 'updated_at'])
export class HistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Deleting a user deletes their history.
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' })
  user: UserEntity;

  @Column()
  UserId: number;

  @CreateDateColumn()
  created_at: Date;

  // Set again when the same comparison is repeated shortly after (see HistoryService.record).
  @UpdateDateColumn()
  updated_at: Date;

  // Steam app id of the game.
  @Column()
  AppId: number;

  @Column({ length: 255 })
  GameName: string;

  // The PC parts compared, as named in the Cpu and Gpu tables; null when not recognised.
  @Column({ type: 'varchar', length: 255, nullable: true })
  CpuName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  GpuName: string | null;

  @Column({ type: 'int', nullable: true })
  RamGb: number | null;

  // How many requirements the PC met, did not meet, and could not be checked.
  @Column({ type: 'smallint' })
  Met: number;

  @Column({ type: 'smallint' })
  Failed: number;

  @Column({ type: 'smallint' })
  ToCheck: number;
}
