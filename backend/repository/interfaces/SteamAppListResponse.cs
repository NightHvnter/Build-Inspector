namespace backend.repository;

using System.Text.Json.Serialization;

public class SteamResponse
{
    [JsonPropertyName("total")]
    public int Total { get; set; }

    [JsonPropertyName("items")]
    public List<GameItem> Items { get; set; } = new();
}

public class GameItem
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("price")]
    public PriceInfo? Price { get; set; }

    [JsonPropertyName("tiny_image")]
    public string TinyImage { get; set; } = string.Empty;

    [JsonPropertyName("metascore")]
    public string Metascore { get; set; } = string.Empty;

    [JsonPropertyName("platforms")]
    public Platforms Platforms { get; set; } = new();

    [JsonPropertyName("streamingvideo")]
    public bool StreamingVideo { get; set; }

    [JsonPropertyName("controller_support")]
    public string? ControllerSupport { get; set; }
}

public class PriceInfo
{
    [JsonPropertyName("currency")]
    public string Currency { get; set; } = string.Empty;

    [JsonPropertyName("initial")]
    public int Initial { get; set; }

    [JsonPropertyName("final")]
    public int Final { get; set; }
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