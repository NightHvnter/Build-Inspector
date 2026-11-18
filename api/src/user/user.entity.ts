import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('User')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ length: 255, unique: true })
  Username: string;

  // Null for Steam accounts: Steam shares no email. Still unique when set.
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  Email: string | null;

  // Null for accounts created through Google or Discord, which have no password.
  @Column({ type: 'varchar', length: 255, nullable: true })
  Password: string | null;

  @Column({ type: 'varchar', nullable: true })
  RefreshToken: string | null;
}