public enum OsFamily
{
    Windows,
    Linux,
    MacOS
}

public class OsDto
{
    public OsFamily Family { get; set; }
    public string? Version { get; set; }    
}