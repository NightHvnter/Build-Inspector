namespace webapi.Controllers;

using Microsoft.AspNetCore.Mvc;
using repository;
using repository.interfaces;
using repository.services;

[ApiController]
[Route("api/[controller]/[action]")]
public class SteamController(ISteamRepo repo) : ControllerBase
{
    private readonly ISteamRepo _repo = repo;
    
    [HttpGet]
    public async Task<IActionResult> GetAppList(string keyword)
    {
        var data = await _repo.SearchGames(keyword);

        return Ok(data);
    }
    [HttpGet]
    public async Task<IActionResult> GetGameDetails(int appid)
    {
        var data = await _repo.GetGameDetails(appid);

        return Ok(data);
    }

    [HttpGet]
    public async Task<IActionResult> GetGameRequirements(int appid)
    {
        var gameDetails = await _repo.GetGameDetails(appid);

        if (gameDetails == null)
        {
            return NotFound();
        }

        var data = _repo.GetCleanSystemRequirements(gameDetails);

        return Ok(data);
    }
}