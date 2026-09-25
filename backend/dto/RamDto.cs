namespace dto;

public enum RamType
{
    DDR3 = 4,
    DDR4 = 5,
    DDR5 = 6
}

public class RamDto
{
    public int? CapacityGB { get; set; } = null;
    public RamType? Type { get; set; } = null;
    public int? ClockSpeed { get; set; } = null;
    public int? Latency { get; set; } = null;
}