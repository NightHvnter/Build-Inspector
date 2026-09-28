using Microsoft.Extensions.Configuration;
using Google.Cloud.Firestore;
using Google.Apis.Auth.OAuth2;

namespace database;

public class ContextDb
{
    private readonly string _key;

    public ContextDb(IConfiguration configuration)
    {
        _key = configuration["private_key"];
    }

    /*
    public FirestoreDb GetFirestore()
    {
        string formattedKey = _key.Replace("\\n", "\n");

       
        string jsonCredentials = $$"""
        {
          "type": "service_account",
          "project_id": "{{_projectId}}",
          "private_key": "{{formattedKey}}",
          "client_email": "{{_clientEmail}}"
        }
        """;
        var builder = new FirestoreDbBuilder
        {
            ProjectId = _projectId,
            Credential = GoogleCredential.FromJson(jsonCredentials)
        };

        return builder.Build();
    }
     */
}


