namespace backend.dto;

public enum OsFamily
{
    Windows,
    Linux,
    MacOS
}

public class OsDto
{
    public OsFamily? Family { get; set; } = null;
    public string? Version { get; set; } = null;
}