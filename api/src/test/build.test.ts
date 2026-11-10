import { Repository } from 'typeorm';
import { BuildService } from '../build/build.service.js';
import { RamDto } from '../common/dto/index.js';
import { CpuEntity, GpuEntity } from '../common/entity/index.js';

describe('BuildService.GetRamWithScore', () => {
  const service = new BuildService(
    {} as Repository<GpuEntity>,
    {} as Repository<CpuEntity>,
  );

  const ram = (overrides: Partial<RamDto> = {}): RamDto => ({
    Name: 'Test kit',
    CapacityGb: 16,
    ClockSpeedMHz: 3200,
    Latency: '16',
    Type: 'DDR4',
    ...overrides,
  });

  it('scores DDR4-3200 CL16 16 GB from speed, latency and capacity', () => {
    // Sv = 3200 * 1 / 100 = 32, latency = 16 * 2000 / 3200 = 10 ns -> Sl = (20 - 10) * 5 = 50,
    // Sc = 16 * 2 = 32 -> 32 * 0.4 + 50 * 0.3 + 32 * 0.3 = 37.4
    expect(service.GetRamWithScore(ram()).Mark).toBeCloseTo(37.4);
  });

  it('uses the latency sent by the client', () => {
    const fast = service.GetRamWithScore(ram({ Latency: '14' })).Mark;
    const slow = service.GetRamWithScore(ram({ Latency: '22' })).Mark;
    expect(fast).toBeGreaterThan(slow);
  });

  it('accepts "CL16" and timing strings like "16-18-18-38"', () => {
    const plain = service.GetRamWithScore(ram()).Mark;
    expect(service.GetRamWithScore(ram({ Latency: 'CL16' })).Mark).toBeCloseTo(plain);
    expect(service.GetRamWithScore(ram({ Latency: '16-18-18-38' })).Mark).toBeCloseTo(plain);
  });

  it('falls back to CL16 when latency is missing or not a number', () => {
    const plain = service.GetRamWithScore(ram()).Mark;
    expect(service.GetRamWithScore(ram({ Latency: '' })).Mark).toBeCloseTo(plain);
    expect(service.GetRamWithScore(ram({ Latency: 'n/a' })).Mark).toBeCloseTo(plain);
  });

  it('never gives a negative latency score', () => {
    // CL40 at 1600 MHz = 50 ns, far above the 20 ns threshold
    const result = service.GetRamWithScore(ram({ Latency: '40', ClockSpeedMHz: 1600, CapacityGb: 0 }));
    expect(result.Mark).toBeCloseTo(1600 / 100 * 0.4);
    expect(result.Mark).toBeGreaterThanOrEqual(0);
  });
});
