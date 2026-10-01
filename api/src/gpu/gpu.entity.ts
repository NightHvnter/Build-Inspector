import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Gpu')
export class GpuEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  created_at: Date;

  @Column({ length: 255 })
  Name: string;

  @Column()
  Mark: number;
}