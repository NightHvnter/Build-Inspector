import { IUserSignIn, IUserSignUp, IDefaultResponse } from "./user";

export async function signUp(user : IUserSignUp) : Promise<IDefaultResponse> {
  const req = await fetch("API_PLACEHOLDER", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  
   if (!req.ok) {
    const o : IDefaultResponse = 
    {
        ok: false,
        message: "Error: Failed to Sign Up!"
    }
    return o
  }

  const o : IDefaultResponse = 
    {
        ok: true,
        message: "Account Created Successfully!"
    }

    return o;
  
}


export async function signIn(user : IUserSignIn) {
  const req = await fetch("API_PLACEHOLDER", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
     if (!req.ok) {
    const o : IDefaultResponse = 
    {
        ok: false,
        message: "Error: Invalid Email and/or Password!"
    }
    return o
  }

  const o : IDefaultResponse = 
    {
        ok: true,
        message: "Successfully Signed In!"
    }
}

export async function signOut() {
  const req = await fetch("API_PLACEHOLDER", {
    method: "GET",
  });
         if (!req.ok) {
    const o : IDefaultResponse = 
    {
        ok: false,
        message: "Error: Failed to Sign Out!"
    }
    return o
  }

  const o : IDefaultResponse = 
    {
        ok: true,
        message: "Successfully Signed Out!"
    }
}