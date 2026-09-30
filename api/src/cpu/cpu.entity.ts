import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cpu')
export class Cpu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;
}