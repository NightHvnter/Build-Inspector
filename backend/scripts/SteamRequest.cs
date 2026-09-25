namespace backend.scripts;

using backend.scripts.interfaces;

// https://store.steampowered.com/api/appdetails?appids={appid}
// https://store.steampowered.com/api/storesearch/?term={string}%27s&l=english&cc=US

public class SteamRequest : ISteamRequest
{
    private string AppDetailsUrl { get; } = "https://store.steampowered.com/api/appdetails?appids=appid";
    private string SeachAppsUrl { get; } = "https://store.steampowered.com/api/storesearch/?term={keyword}%27s&l=english&cc=US";
    private static readonly HttpClient client = new();

    public void GetGameDetails(int appid)
    {
        string? res = null;


    }

    public void GetGamesSpecs(int appid)
    {
        throw new NotImplementedException();
    }

    public async Task<string?> SearchGames(string keyword)
    {
        string? body = null;
        string url = SeachAppsUrl.Replace("keyword", keyword);

        Console.WriteLine(url);

        try
        {
            HttpResponseMessage response = await client.GetAsync(url);
            response.EnsureSuccessStatusCode();

            body = await response.Content.ReadAsStringAsync();
        } catch(HttpRequestException e)
        {
            Console.WriteLine($"Request error: {e.StatusCode}\n{e.Message}");
        }

        return body;
    }
}
