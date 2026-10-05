export interface IUserSignUp
{
    username : string;
    email : string;
    password : string;
}

export interface IUserSignIn
{
    email : string;
    password : string;

}

export interface IDefaultResponse 
{
    ok : boolean;
    message : string;
}