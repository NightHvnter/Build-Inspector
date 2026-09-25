public enum RamType
{
    DDR3,
    DDR4,
    DDR5
}

public class RAMDTO
{
    public int CapacityGB { get; set; }
    public RamType Type { get; set; }
}