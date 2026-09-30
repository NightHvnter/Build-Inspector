import { Injectable } from '@nestjs/common';

@Injectable()
export class CpuService {
  getAll() {
    return `This action returns all cpus`;
  }

  findOne(id: number) {
    return `This action returns a #id cpu`;
  }

  update(id: number, updateCpuDto: string) {
    return `This action updates a #id cpu`;
  }

  remove(id: number) {
    return `This action removes a #id cpu`;
  }
}
