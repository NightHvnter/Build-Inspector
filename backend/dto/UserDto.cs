using System.Text.Json.Serialization;

namespace dto;


public class UserDto
{
    [JsonPropertyName("username")]
    public string Username { get; set; }

    [JsonPropertyName("email")]
    public string Email { get; set; } 

    [JsonPropertyName("password")]
    public string Password { get; set; }
}