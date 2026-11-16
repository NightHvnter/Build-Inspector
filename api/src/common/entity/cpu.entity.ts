import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Cpu')
export class CpuEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  Name: string;

  @Column()
  Mark: number;

  @Column({ type: 'int', nullable: true })
  Cores: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  Socket: string | null;
}