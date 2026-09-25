namespace dto;

public class CpuDto
{
    public string? Family { get; set; } = null;
    public int? Generation { get; set; } = null;
    public string? Flags { get; set; } = null;
    public double? MaxClock { get; set; } = null;
    public int? Rating { get; set; } = null;
}