namespace scripts.interfaces;

public interface ISteamRequest
{
    abstract Task<string?> SearchGames(string keyword);
    abstract Task<string?> GetGameDetails(int appid);
}