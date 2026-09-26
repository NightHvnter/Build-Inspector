namespace repository.services;

using System.Text.RegularExpressions;
using repository.interfaces;
using scripts;

public class BuildRepo : IBuildRepo
{
    private readonly BuildInfo _buildInfo = new();
    public string GetCpu()
    {
        return _buildInfo.GetCpu()[0];
    }

    public string GetGpu()
    {
        return _buildInfo.GetGpu()[0];
    }

    public RamDetails GetRam()
    {
        string raw = _buildInfo.GetRamSpeed();
        if (raw is null) return new RamDetails {ClockSpeed=null, TotalMemory=_buildInfo.GetTotalRamGb()};
        if (raw is null) return new RamDetails {ClockSpeed=-1, TotalMemory=_buildInfo.GetTotalRamGb()};
        return new RamDetails {ClockSpeed=int.Parse(Regex.Match(raw, @"\d\d+").Value), TotalMemory=_buildInfo.GetTotalRamGb()};
    }
}