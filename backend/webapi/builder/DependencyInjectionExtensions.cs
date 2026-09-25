using backend.repository.interfaces;
using backend.repository.services;

namespace backend.webapi.builder;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddTransient<ISteamRepo, SteamRepo>();

        return services;
    }
}