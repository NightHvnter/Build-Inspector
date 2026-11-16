import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('Cpu')
export class CpuEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ length: 255 })
  Name: string;

  @Column()
  Mark: number;

  @Column({ type: 'int', nullable: true })
  Cores: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  Socket: string | null;
}
