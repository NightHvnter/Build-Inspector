import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CpuEntity as Cpu } from './cpu.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class CpuService {
  constructor(
    @InjectRepository(Cpu)
    private readonly CpuRepo: Repository<Cpu>,
  ) {}

  async findAll(): Promise<Cpu[]> {
    return await this.CpuRepo.find();
  }

  async findOne(id: number): (Promise<Cpu | null>) {
    return await this.CpuRepo.findOneBy({ id })
  }
}
