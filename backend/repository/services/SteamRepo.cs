namespace backend.repository.services;

using System.Text.Json;
using backend.repository.interfaces;
using backend.scripts;

public class SteamRepo : ISteamRepo
{
    public static async Task<SteamResponse?> SearchGames(string keyword)
    {
        SteamRequest sr = new();

        string? SteamResRaw = await sr.SearchGames(keyword);

        if (SteamResRaw is null) {
            return null;
        }

        SteamResponse? data = JsonSerializer.Deserialize<SteamResponse>(SteamResRaw);

        return data;
    }
}