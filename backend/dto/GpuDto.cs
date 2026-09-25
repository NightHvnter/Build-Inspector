namespace dto;

public class GpuDto
{
    public string? Vendor { get; set; } = null;
    public string? Model { get; set; } = null;
    public string[]? Flags { get; set; } = null;
    public int? Vram { get; set; } = null;
    public int? Rating { get; set; } = null;
}