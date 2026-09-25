namespace webapi;

using Microsoft.AspNetCore.Mvc;
using backend.repository;
using backend.repository.services;

[ApiController]
[Route("api/[controller]/[action]")]
public class SteamController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAppList(string keyword)
    {
        var games = await SteamRepo.SearchGames(keyword);

        return Ok(new {games});
    }
}