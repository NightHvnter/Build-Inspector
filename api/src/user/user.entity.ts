import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('User')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ length: 255, unique: true })
  Username: string;

  @Column({ length: 255, unique: true })
  Email: string;

  @Column({ length: 255 })
  Password: string;

  @Column({ type: 'varchar', nullable: true })
  RefreshToken: string | null;
}