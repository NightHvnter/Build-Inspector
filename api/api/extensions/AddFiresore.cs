using Google.Apis.Auth.OAuth2;
using Google.Cloud.Firestore;
using Google.Cloud.Firestore.V1;

namespace api.extensions
{
    public static class FirestoreExtensions
    {
        public static IServiceCollection AddFirestore(this IServiceCollection services, IConfiguration config)
        {
            var projectId = config["Firestore:ProjectId"];
            var json = config["Firestore:CredentialsJson"];

            var credential = CredentialFactory
                .FromFile<ServiceAccountCredential>(json)
                .ToGoogleCredential();

            var client = new FirestoreClientBuilder { GoogleCredential = credential }.Build();
            services.AddSingleton(FirestoreDb.Create(projectId, client));

            return services;
        }
    }
}