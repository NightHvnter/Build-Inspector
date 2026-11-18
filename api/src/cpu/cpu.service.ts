import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CpuEntity as Cpu } from '../common/entity/cpu.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class CpuService {
  constructor(
    @InjectRepository(Cpu)
    private readonly CpuRepo: Repository<Cpu>,
  ) {}

  async findOne(id: number): (Promise<Cpu | null>) {
    return await this.CpuRepo.findOneBy({ id })
  }

  async findAll(): Promise<{ Name: string; Mark: number }[]> {
    return await this.CpuRepo.find({
      select: { Name: true, Mark: true },
      order: { Name: 'ASC' },
    });
  }
}
