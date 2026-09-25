namespace repository.services;

using System.Text.Json;
using System.Text.RegularExpressions;
using repository.interfaces;
using scripts;

public class SteamRepo : ISteamRepo
{
    private readonly SteamRequest sr = new();

    public async Task<SteamResponse?> SearchGames(string keyword)
    {
        string? SteamResRaw = await sr.SearchGames(keyword);

        if (SteamResRaw is null) {
            return null;
        }

        SteamResponse? data = JsonSerializer.Deserialize<SteamResponse>(SteamResRaw);

        return data;
    }

    public async Task<GameDetail?> GetGameDetails(int appid)
    {
        string? steamResRaw = await sr.GetGameDetails(appid);

        if (string.IsNullOrEmpty(steamResRaw)) {
            return null;
        }

        // Steam restituisce un dizionario con chiave dinamica (es. "730")
        var responseDict = JsonSerializer.Deserialize<Dictionary<string, GameResultWrapper>>(steamResRaw);

        // Estrae il wrapper e verifica che la chiamata sia andata a buon fine
        var gameWrapper = responseDict?.Values.FirstOrDefault();

        if (gameWrapper == null || !gameWrapper.Success || gameWrapper.Data == null) {
            return null;
        }

        return gameWrapper.Data;
    }

    public CleanedRequirementsResponse GetCleanSystemRequirements(GameDetail gameData)
    {
        return new CleanedRequirementsResponse
        {
            Windows = new CleanedRequirements
            {
                Minimum = StripHtml(gameData.PcRequirements?.Minimum),
                Recommended = StripHtml(gameData.PcRequirements?.Recommended)
            },
            Mac = new CleanedRequirements
            {
                Minimum = StripHtml(gameData.MacRequirements?.Minimum),
                Recommended = StripHtml(gameData.MacRequirements?.Recommended)
            },
            Linux = new CleanedRequirements
            {
                Minimum = StripHtml(gameData.LinuxRequirements?.Minimum),
                Recommended = StripHtml(gameData.LinuxRequirements?.Recommended)
            }
        };
    }

    public string? StripHtml(string? htmlInput)
    {
        if (string.IsNullOrEmpty(htmlInput))
        {
            return null;
        }

        string noHtml = Regex.Replace(htmlInput, "<.*?>", string.Empty);
        return System.Net.WebUtility.HtmlDecode(noHtml).Trim();
    }
}