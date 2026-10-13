import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('User')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  created_at: Date;

  @Column({ length: 255 })
  Username: string;

  @Column({ length: 255, unique: true })
  Email: string;

  @Column({ length: 255 })
  Password: string;
}