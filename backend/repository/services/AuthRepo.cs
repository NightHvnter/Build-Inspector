using repository.interfaces;
using Google.Cloud.Firestore;
using dto;

namespace repository.services;


public class AuthRepo : IAuthRepo
{
    public void SignIn(UserDto u)
    {
        ;
    }

    public void SignOut()
    {
        throw new NotImplementedException();
    }

    public void SignUp()
    {
        throw new NotImplementedException();
    }
}