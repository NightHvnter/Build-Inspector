import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoryEntity } from './history.entity.js';
import { CreateHistoryDto, HistoryItemDto } from './history.dto.js';

// Entries kept per user; older ones are deleted.
export const MAX_ENTRIES = 100;

function toItem(entry: HistoryEntity): HistoryItemDto {
  return {
    id: entry.id,
    AppId: entry.AppId,
    GameName: entry.GameName,
    CpuName: entry.CpuName,
    GpuName: entry.GpuName,
    RamGb: entry.RamGb,
    Met: entry.Met,
    Failed: entry.Failed,
    ToCheck: entry.ToCheck,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  };
}

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryEntity)
    private readonly repo: Repository<HistoryEntity>,
  ) {}

  async list(userId: number): Promise<HistoryItemDto[]> {
    const entries = await this.repo.find({
      where: { UserId: userId },
      order: { updated_at: 'DESC', id: 'DESC' },
      take: MAX_ENTRIES,
    });
    return entries.map(toItem);
  }

  async record(userId: number, dto: CreateHistoryDto): Promise<HistoryItemDto> {
    const values = {
      AppId: dto.AppId,
      GameName: dto.GameName.trim(),
      CpuName: dto.CpuName?.trim() || null,
      GpuName: dto.GpuName?.trim() || null,
      RamGb: dto.RamGb ?? null,
      Met: dto.Met,
      Failed: dto.Failed,
      ToCheck: dto.ToCheck,
    };
    // Every comparison is its own entry, also when the same game is tested again: the app
    // records each comparison page once, so reloads don't add duplicates.
    const saved = await this.repo.save(this.repo.create({ ...values, UserId: userId }));
    await this.trim(userId);
    return toItem(saved);
  }

  async remove(userId: number, id: number): Promise<void> {
    // Matching on the user too: nobody can delete someone else's entry by id.
    const result = await this.repo.delete({ id, UserId: userId });
    if (!result.affected) throw new NotFoundException();
  }

  async clear(userId: number): Promise<void> {
    await this.repo.delete({ UserId: userId });
  }

  private async trim(userId: number): Promise<void> {
    const old = await this.repo.find({
      select: { id: true },
      where: { UserId: userId },
      order: { updated_at: 'DESC', id: 'DESC' },
      skip: MAX_ENTRIES,
      take: 1000, // MariaDB needs a LIMIT with an OFFSET
    });
    if (old.length) await this.repo.delete(old.map((entry) => entry.id));
  }
}
