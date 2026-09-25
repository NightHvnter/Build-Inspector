namespace backend.scripts.interfaces;

public interface ISteamRequest
{
    abstract Task<string?> SearchGames(string keyword);
    abstract void GetGamesSpecs(int appid);
    abstract Task<string?> GetGameDetails(int appid);
}