import type { ScannedPc } from '@shared/types/scan';

export const healthyPc: ScannedPc = {
  scannedAt: '2026-10-05T10:00:00.000Z',
  os: { platform: 'win32', distro: 'Microsoft Windows 11 Pro', release: '10.0.22631' },
  cpu: { name: 'AMD Ryzen 5 5600X', cores: 6, threads: 12, baseClockGhz: 3.7, socket: 'AM4' },
  gpus: [
    { name: 'NVIDIA GeForce RTX 3060', model: 'NVIDIA GeForce RTX 3060', vendor: 'NVIDIA', vramMb: 12288 }
  ],
  ram: {
    totalGb: 32,
    modules: [
      { sizeGb: 16, type: 'DDR4', speedMhz: 3200, partNumber: '' },
      { sizeGb: 16, type: 'DDR4', speedMhz: 3200, partNumber: '' }
    ]
  },
  storage: [{ name: 'Samsung SSD 970', type: 'NVMe', sizeGb: 1000 }],
  motherboard: { manufacturer: 'ASUSTeK', model: 'TUF B550' }
}