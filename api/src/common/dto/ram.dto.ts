export class RamDto {
    Name: string;
    CapacityGb: number;
    ClockSpeedMHz: number;
    Latency: string;
    Type: "DDR5" | "DDR4" | "DDR3";
}