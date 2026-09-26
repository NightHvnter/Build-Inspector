namespace repository.interfaces;


public interface IAuthRepo
{
    public abstract void SignUp ();
    public abstract void SignIn ();
    public abstract void SignOut ();
}