import { IGameDetails, IRequirements } from "./steam";

type SteamReply<T> = { ok: true; message: string; data: T } | { ok: false; message: string };
import { apiUrl } from "../apiUrl";
import type { SteamSearchReply, SteamSearchResult } from "../shared/types/steam";

// GET /steam/games/search?q= on the API, which proxies Steam's store search.
export async function searchSteamGames(term: string): Promise<SteamSearchReply> {
  try {
    const req = await fetch(apiUrl(`/steam/games/search?q=${encodeURIComponent(term)}`), {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });
    if (!req.ok) return { ok: false, message: "Ricerca su Steam non riuscita. Riprova." };
    const items: unknown = await req.json();
    const data = (Array.isArray(items) ? items : []).filter(
      (i): i is SteamSearchResult =>
        typeof i?.appId === "number" && Number.isSafeInteger(i.appId) && typeof i?.name === "string"
    );
    return { ok: true, data };
  } catch {
    return { ok: false, message: "Servizio Steam non raggiungibile. Controlla che l'API sia avviata." };
  }
}

// GET /steam/games/:appId on the API, which proxies Steam's appdetails.
async function fetchGame(steam_appid: number | string): Promise<IGameDetails | null> {
  const req = await fetch(apiUrl(`/steam/games/${encodeURIComponent(String(steam_appid))}`), {
    method: "GET",
  });
  if (!req.ok) return null;
  // The API answers with an empty body when Steam doesn't know the app id.
  const text = await req.text();
  return text ? (JSON.parse(text) as IGameDetails) : null;
}

export async function getSteamGameDetails(steam_appid: number | string): Promise<SteamReply<IGameDetails>>
{
  const data = await fetchGame(steam_appid).catch(() => null);
  if (!data)
  {
    return { ok: false, message: "Error: Failed to Get Game Details!" };
  }

  return {
    ok: true,
    message: "Game Found!",
    data
  };
}


export async function getSteamGameRequirements(steam_appid: number | string): Promise<SteamReply<IRequirements>>
{
  // The API has no separate requirements route: they come with the game details.
  const game = await fetchGame(steam_appid).catch(() => null);
  if (!game)
  {
    return { ok: false, message: "Error: Failed to Get Game Requirements!" };
  }
  const data: IRequirements = Array.isArray(game.pc_requirements) ? {} : game.pc_requirements;

  return {
    ok: true,
    message: "Requirements Found!",
    data
  };
}
