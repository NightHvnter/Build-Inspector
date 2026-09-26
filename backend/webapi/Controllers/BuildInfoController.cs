namespace webapi.Controllers;

using Microsoft.AspNetCore.Mvc;
using repository.interfaces;

[ApiController]
[Route("api/[controller]/[action]")]
public class BuildInfoController(IBuildRepo repo) : ControllerBase
{
    private readonly IBuildRepo _repo = repo;

    [HttpGet]
    public IActionResult GetRam()
    {
        var o = _repo.GetRam();
        if(o is not null && o.ClockSpeed is null) return BadRequest(new { message = "Dati non disponibili o non trovati." });
        if(o is not null && o.ClockSpeed == -1) return NoContent();

        return Ok(o);
    }

    [HttpGet]
    public IActionResult GetCpu()
    {
        var o = _repo.GetCpu();

        return Ok(o);
    }

    [HttpGet]
    public IActionResult GetGpu()
    {
        var o = _repo.GetGpu();

        return Ok(o);
    }
}