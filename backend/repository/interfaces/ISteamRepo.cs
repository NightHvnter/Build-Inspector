namespace backend.repository.interfaces;

public interface ISteamRepo
{
    static abstract Task<SteamResponse?> SearchGames(string keyword);
}