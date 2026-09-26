using repository.interfaces;
using repository.services;

namespace webapi.builder;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddTransient<ISteamRepo, SteamRepo>();
        services.AddTransient<IBuildRepo, BuildRepo>();

        return services;
    }
}