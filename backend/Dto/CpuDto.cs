using System.Security.Cryptography;

namespace backend.Dto;

public class CpuDto
{
    public string? Family { get; set; } = null;
    public int? Generation { get; set; } = null;
    public string? Flags { get; set; } = null;
}