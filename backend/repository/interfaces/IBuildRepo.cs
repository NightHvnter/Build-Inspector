namespace repository.interfaces;

public interface IBuildRepo
{
    abstract string GetCpu();
    abstract RamDetails? GetRam();
    abstract string GetGpu();
}