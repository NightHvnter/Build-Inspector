import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GpuEntity as Gpu } from './gpu.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class GpuService {
  constructor(
    @InjectRepository(Gpu)
    private readonly CpuRepo: Repository<Gpu>,
  ) {}

  async findOne(id: number): (Promise<Gpu | null>) {
    return await this.CpuRepo.findOneBy({ id })
  }
}
