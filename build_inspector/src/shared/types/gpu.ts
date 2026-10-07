export const isIntegratedGpu = (name: string): boolean =>
  /(UHD|Iris|HD Graphics|Radeon\s*(\(TM\)\s*)?Graphics|Vega\s*\d+)/i.test(name)