namespace backend.scripts.interfaces;

public interface ISteamRequest
{
    abstract Task<string?> SearchGames(string keyword);
    abstract void GetGamesSpecs(int appid);
    abstract void GetGameDetails(int appid);
}