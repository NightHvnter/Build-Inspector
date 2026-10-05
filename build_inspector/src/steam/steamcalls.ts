import {
  IGameDetails,
  ISteamDetailsResponse,
  ISteamSearchItem,
  ISteamSearchResponse,
} from "./steam";

import { IDefaultResponse } from "../auth/user";

const STORE_URL = "https://store.steampowered.com/api";

export async function searchGames(term : string) : Promise<IDefaultResponse> {
  const req = await fetch(
    `${STORE_URL}/storesearch/?term=${encodeURIComponent(term)}&cc=us&l=en`
  );

  if (!req.ok) {
    const o : IDefaultResponse = 
    {
        ok : false,
        message : "Error: failed to get game(s)!"
    }
    return o
  }

  const o : IDefaultResponse = 
  {
    ok : true,
    message : "Success!"
  }
}



export async function getGameDetails(appId : number) {
  const req = await fetch(`${STORE_URL}/appdetails?appids=${appId}&l=english`);

  if (!req.ok) {
    return { ok: false, message: "Error: Failed to Get Game Details!" };
  }

  const req2 : ISteamDetailsResponse = await req.json();
  const game = req2[appId];

  // Steam answers 200 even for unknown games, so "success" has to be checked too
  if (!game || !game.success || !game.data) {
    return { ok: false, message: "Error: Game Not Found!" };
  }

  return { ok: true, message: "Game Found!", data: game.data };
}

// Removes <strong>, <br>, <li>... and keeps one line per item
export function cleanRequirements(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export async function getCleanRequirements(
  appId: number
): Promise<IDataResponse<{ minimum: string; recommended: string }>> {
  const details = await getGameDetails(appId);

  if (!details.ok || !details.data) {
    return { ok: false, message: details.message };
  }

  const req = details.data.pc_requirements;

  // Steam sends [] when a game has no requirements
  if (Array.isArray(req)) {
    return { ok: false, message: "This game has no PC requirements listed!" };
  }

  return {
    ok: true,
    message: "Requirements Found!",
    data: {
      minimum: cleanRequirements(req.minimum ?? ""),
      recommended: cleanRequirements(req.recommended ?? ""),
    },
  };
}