import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Cpu')
export class CpuEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  created_at: Date;

  @Column({ length: 255 })
  Name: string;

  @Column()
  Mark: number;

  @Column()
  Cores: number;

  @Column({ length: 255 })
  Socket: string;
}