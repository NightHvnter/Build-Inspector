namespace backend.repository.interfaces;

using System.Text.Json.Serialization;

// Root: Steam restituisce un dizionario la cui chiave è l'ID del gioco
public class SteamGameResponse
{
    // Usiamo un dizionario perché la chiave radice cambia in base all'AppId
    [JsonExtensionData]
    public Dictionary<string, System.Text.Json.JsonElement> Apps { get; set; } = new();
}

public class GameResultWrapper
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("data")]
    public GameDetail? Data { get; set; }
}

public class GameDetail
{
    [JsonPropertyName("steam_appid")]
    public int AppId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("is_free")]
    public bool IsFree { get; set; }

    [JsonPropertyName("short_description")]
    public string ShortDescription { get; set; } = string.Empty;

    [JsonPropertyName("developers")]
    public List<string> Developers { get; set; } = new();

    [JsonPropertyName("publishers")]
    public List<string> Publishers { get; set; } = new();

    [JsonPropertyName("release_date")]
    public ReleaseDateInfo? ReleaseDate { get; set; }

    [JsonPropertyName("platforms")]
    public Platforms Platforms { get; set; } = new();

    // Nuove proprietà per i requisiti
    [JsonPropertyName("pc_requirements")]
    public SystemRequirements? PcRequirements { get; set; }

    [JsonPropertyName("mac_requirements")]
    public SystemRequirements? MacRequirements { get; set; }

    [JsonPropertyName("linux_requirements")]
    public SystemRequirements? LinuxRequirements { get; set; }
}

public class SystemRequirements
{
    [JsonPropertyName("minimum")]
    public string? Minimum { get; set; }

    [JsonPropertyName("recommended")]
    public string? Recommended { get; set; }
}

public class ReleaseDateInfo
{
    [JsonPropertyName("coming_soon")]
    public bool ComingSoon { get; set; }

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;
}

public class Platforms
{
    [JsonPropertyName("windows")]
    public bool Windows { get; set; }

    [JsonPropertyName("mac")]
    public bool Mac { get; set; }

    [JsonPropertyName("linux")]
    public bool Linux { get; set; }
}

public class CleanedRequirementsResponse
{
    [JsonPropertyName("windows")]
    public CleanedRequirements? Windows { get; set; }
    [JsonPropertyName("mac")]
    public CleanedRequirements? Mac { get; set; }
    [JsonPropertyName("linux")]
    public CleanedRequirements? Linux { get; set; }
}

public class CleanedRequirements
{
    [JsonPropertyName("minimum")]
    public string? Minimum { get; set; }
    [JsonPropertyName("recommended")]
    public string? Recommended { get; set; }
}