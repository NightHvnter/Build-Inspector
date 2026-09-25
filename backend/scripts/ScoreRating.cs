namespace scripts;

using dto;

public class ScoreRating
{
    public int GetRamScore(RamDto ram)
    {
        if (ram is not { CapacityGB: not null, Type: not null, ClockSpeed: not null, Latency: not null })
        {
            return 0;
        }

        int Rl = (int)((ram.Latency * 2000) / ram.ClockSpeed);
        int Sv = (int)(ram.ClockSpeed * (int)ram.Type * 0.2);
        int Sl = Math.Max(0, 20 - Rl) * 5;
        int Sc = Math.Min(ram.CapacityGB ?? 0, 64) * 2;

        return (int)((Sv * 0.4) + (Sl * 0.3) + (Sc * 0.3));
    }

    public int BuildRating(BuildDto build)
    {
        if(build is not { Cpu.Rating: not null, Gpu.Rating: not null, Ram: not null}) return 0;

        return (int)(build.Cpu.Rating + build.Gpu.Rating + GetRamScore(build.Ram));
    }
    public double CompareBuilds(BuildDto user, BuildDto required)
    {
        return BuildRating(user) / BuildRating(required);
    }
}