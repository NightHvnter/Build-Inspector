import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GpuEntity as Gpu } from '../common/entity/gpu.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class GpuService {
  constructor(
    @InjectRepository(Gpu)
    private readonly GpuRepo: Repository<Gpu>,
  ) {}

  async findOne(id: number): (Promise<Gpu | null>) {
    return await this.GpuRepo.findOneBy({ id })
  }

  async findAll(): Promise<{ Name: string; Mark: number }[]> {
    return await this.GpuRepo.find({
      select: { Name: true, Mark: true },
      order: { Name: 'ASC' },
    });
  }
}
