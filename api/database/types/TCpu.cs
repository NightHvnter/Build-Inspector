using Google.Cloud.Firestore;

namespace database.types
{
    [FirestoreData]
    public class TCpu
    {
        [FirestoreDocumentId]
        public string? Id { get; set; }
        [FirestoreProperty]
        public int Cores { get; set; } = 0;
        [FirestoreProperty]
        public int Cpu { get; set; } = 0;
        [FirestoreProperty]
        public string Name { get; set; } = "";
        [FirestoreProperty]
        public string Socket { get; set; } = "";
    }
}
