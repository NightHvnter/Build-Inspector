namespace scripts;

using Hardware.Info;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

public class BuildInfo
{
    private readonly HardwareInfo info = new();

    public BuildInfo()
    {
        info.RefreshCPUList();
        info.RefreshVideoControllerList();
        info.RefreshMemoryStatus();
    }

    public List<string> GetCpu()
    {
        var cpus = info.CpuList;

        List<string> o = [];

        foreach(var cpu in cpus)
        {
            o.Add(GetCleanCpuName(cpu.Name));
        }

        return o;
    }
    public List<string> GetGpu()
    {
        var gpus = info.VideoControllerList;

        List<string> o = [];

        foreach(var gpu in gpus)
        {
            o.Add(GetCleanGpuName(gpu.Name));
        }

        return o;
    }

    private static string GetCleanCpuName(string rawName)
    {
        string cleaned = rawName.Replace("(R)", "").Replace("(TM)", "").Replace("®", "").Replace("™", "");
        
        cleaned = Regex.Replace(cleaned, @"^\d+(st|nd|rd|th)\s+Gen\s+", "", RegexOptions.IgnoreCase);
        
        // Rimuove suffissi come " 8-Core Processor" o semplicemente "Processor"
        cleaned = Regex.Replace(cleaned, @"\s+\d+-Core\s+Processor", "", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"\s+Processor", "", RegexOptions.IgnoreCase);

        return cleaned.Trim();
    }

    private static string GetCleanGpuName(string rawName)
    {
        // Cerca il testo all'interno delle parentesi quadre [...]
        var match = Regex.Match(rawName, @"\[(.*?)\]");
        if (match.Success)
        {
            string inner = match.Groups[1].Value;
            // Se ci sono più varianti separate da '/', prendi la prima (es. Radeon RX 7900 XT)
            return inner.Split('/')[0].Trim();
        }

        // Se non ci sono parentesi quadre, restituisce il nome ripulito da eventuali codici tra parentesi tonde
        return Regex.Replace(rawName, @"\s*\(.*?\)", "").Trim();
    }
    public double GetTotalRamGb()
    {
        return info.MemoryStatus.TotalPhysical / (1024.0 * 1024 * 1024);
    }

    public string? GetRamSpeed()
    {
        string command = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "wmic memorychip get speed" : "dmidecode -t memory";
        if (command is null) return null;
        string output = ExecuteWithPrivileges(command);

        if (output is null) return null;

        var match = Regex.Match(output, @"Speed:\s*([0-9]+(?:\s*MT/s|[_]?MHz)?)", RegexOptions.IgnoreCase);
        if (match.Success)
        {
            return match.Groups[1].Value;
        }

        return "";
    }

    private static string? ExecuteWithPrivileges(string command)
    {
        string fullCommand = command;

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            if (Environment.GetEnvironmentVariable("DISPLAY") != null || Environment.GetEnvironmentVariable("WAYLAND_DISPLAY") != null)
            {
                fullCommand = (bool)IsCommandAvailable("pkexec") ? $"pkexec {command}" : $"sudo {command}";
            }
            else
            {
                fullCommand = $"sudo {command}";
            }
        }
        else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
        {
            fullCommand = $"osascript -e 'do shell script \"{command}\" with administrator privileges'";
        }

        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "cmd.exe" : "/bin/bash",
                Arguments = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? $"/c {fullCommand}" : $"-c \"{fullCommand}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(startInfo);
            if (process is null) return null;
            string output = process.StandardOutput.ReadToEnd();
            process.WaitForExit();
            return output;
        }
        catch
        {
            return string.Empty;
        }
    }

    private static bool? IsCommandAvailable(string commandName)
    {
        try
        {
            var psi = new ProcessStartInfo("which", commandName) { RedirectStandardOutput = true, UseShellExecute = false };
            using var p = Process.Start(psi);
            if (p is null) return null;
            p.WaitForExit();
            return p.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }
}