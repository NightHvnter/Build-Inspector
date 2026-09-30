using database.interfaces;
using Google.Cloud.Firestore;

namespace database.collections
{
    public class CCpu(FirestoreDb db) : ICpuColletion
    {
        private readonly CollectionReference _coolection = db.Collection("Cpus");

        public void GetCpu()
        {
            throw new NotImplementedException();
        }
    }
}
