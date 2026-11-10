import { IGameDetails, IRequirements } from "./steam";

// steam game list(default)
// steam game list(search by name)

export async function getSteamGameDetails (_steam_appid : number | string) 
{
  //const req = await fetch(`API_PLACEHOLDER/games/${steam_appid}...?
  const req = await fetch("API_PLACEHOLDER", { method: "GET" });
    if (!req.ok) 
  {
    return { ok: false, message: "Error: Failed to Get Game Details!" };
  }
  const data : IGameDetails = await req.json();

  return { 
    ok: true, 
    message: "Game Found!", 
    data 
  };
}


export async function getSteamGameRequirements(_steam_appid : number | string) 
{
  //const req = await fetch(`API_PLACEHOLDER/games/${steam_appid}...?
  const req = await fetch("API_PLACEHOLDER", { method: "GET" });
  if (!req.ok) 
  {
    return { ok: false, message: "Error: Failed to Get Game Requirements!" };
  }
  const data : IRequirements = await req.json();

  return { 
    ok: true, 
    message: "Requirements Found!", 
    data 
  };
}








