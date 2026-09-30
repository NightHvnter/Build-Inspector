using Google.Cloud.Firestore;

namespace database
{
    public class DbContext
    {
        private readonly FirestoreDb _db;
        public DbContext(FirestoreDb db) => _db = db;

    }
}
