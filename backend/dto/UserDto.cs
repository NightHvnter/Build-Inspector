using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace dto;


public class UserDto
{
    [Required][JsonPropertyName("username")]
    public string Username { get; set; } = "";

    [Required][JsonPropertyName("email")]
    public string Email { get; set; } = "";

    [Required][JsonPropertyName("password")]
    public string Password { get; set; } = "";
}
