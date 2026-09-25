namespace backend.Dto;

public enum RamType
{
    DDR3,
    DDR4,
    DDR5
}

public class RamDto
{
    public int? CapacityGB { get; set; } = null;
    public RamType? Type { get; set; } = null;
    public int? ClockSpeed { get; set; } = null;
    public string? Latency { get; set; } = null;
}