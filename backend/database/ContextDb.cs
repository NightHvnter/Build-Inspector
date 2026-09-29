using Microsoft.Extensions.Configuration;
using Google.Cloud.Firestore;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Http.HttpResults;

namespace database;

public class ContextDb
{
    private readonly IConfiguration _configuration;

    public ContextDb(IConfiguration configuration)
    {
        _configuration = configuration;
    }


    /*[HttpGet("api-key")]
        public IActionResult GetApiKey()
        {
            var apiKey = _configuration["AppSettings:ApiKey"];
            return Ok(new { ApiKey = apiKey });
        }

        [HttpGet]
        public IActionResult GetProduct()
        {
            return Ok(new
            {…
    */

    public FirestoreDb GetFirestore()
    {
        string ApiKey = _configuration["firebase:private_key"];

        return Ok(new { private_key = ApiKey });
    }
}


