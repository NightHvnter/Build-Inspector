namespace backend.repository.interfaces;

public interface ISteamRepo
{
    public abstract Task<SteamResponse?> SearchGames(string keyword);
    public abstract Task<GameDetail?> GetGameDetails(int appid);
    public abstract string? StripHtml(string? htmlInput);
    public abstract CleanedRequirementsResponse? GetCleanSystemRequirements(GameDetail gameData);
}