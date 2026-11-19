import { IGameDetails, IRequirements } from "./steam";

type SteamReply<T> = { ok: true; message: string; data: T } | { ok: false; message: string };
import { apiUrl } from "../apiUrl";
import type {
  GameRequirementsReply,
  SteamSearchReply,
  SteamSearchResult,
  TopGame,
  TopGamesReply,
  TopGenresReply,
} from "../shared/types/steam";
import { parseRequirements, sizeInGb } from "./requirements";

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

// A game's minimum PC requirements, as plain text rows for the game details dialog.
export async function getGameMinimumRequirements(appId: number): Promise<GameRequirementsReply> {
  let game: unknown;
  try {
    const req = await fetch(apiUrl(`/steam/games/${appId}`), {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });
    if (!req.ok) return { ok: false, message: "Requisiti non disponibili su Steam. Riprova." };
    // The API answers with an empty body when Steam doesn't know the app id.
    const text = await req.text();
    game = text ? JSON.parse(text) : null;
  } catch {
    return { ok: false, message: "Servizio Steam non raggiungibile. Controlla che l'API sia avviata." };
  }
  if (typeof game !== "object" || game === null)
    return { ok: false, message: "Gioco non trovato su Steam." };
  const { name, pc_requirements } = game as { name?: unknown; pc_requirements?: unknown };
  const minimumHtml =
    typeof pc_requirements === "object" && pc_requirements !== null && !Array.isArray(pc_requirements)
      ? (pc_requirements as { minimum?: unknown }).minimum
      : undefined;
  const minimum = parseRequirements(minimumHtml);
  const ram = minimum.find((row) => row.kind === "ram");
  const storage = minimum.find((row) => row.kind === "storage");
  return {
    ok: true,
    data: {
      appId,
      name: typeof name === "string" ? name : "",
      minimum,
      ramGb: ram ? sizeInGb(ram.value) : null,
      storageGb: storage ? sizeInGb(storage.value) : null,
    },
  };
}

// How many games the catalog shows from the chart, with or without a genre.
const TOP_LIMIT = 12;

// GET /steam/games/top on the API: the most played games over the last 7 days, optionally
// only those of one genre.
export async function getTopGames(genre?: string): Promise<TopGamesReply> {
  try {
    const query = `?limit=${TOP_LIMIT}` + (genre ? "&genre=" + encodeURIComponent(genre) : "");
    // The first genre request may have to load the whole chart's details from Steam.
    const req = await fetch(apiUrl("/steam/games/top" + query), { signal: AbortSignal.timeout(60000) });
    if (!req.ok) return { ok: false, message: "Classifica di Steam non disponibile." };
    return { ok: true, data: toTopGames(await req.json(), TOP_LIMIT) };
  } catch {
    return { ok: false, message: "Classifica di Steam non raggiungibile. Controlla che l'API sia avviata." };
  }
}

// GET /steam/games/top/genres on the API: the charted games' genres, the most common first.
export async function getTopGenres(): Promise<TopGenresReply> {
  try {
    const req = await fetch(apiUrl("/steam/games/top/genres"), { signal: AbortSignal.timeout(60000) });
    if (!req.ok) return { ok: false, message: "Generi non disponibili." };
    const rows: unknown = await req.json();
    const data = (Array.isArray(rows) ? rows : [])
      .map((row) => (row as { name?: unknown })?.name)
      .filter((name): name is string => typeof name === "string" && !!name.trim() && name.length <= 50)
      .slice(0, 40);
    return { ok: true, data };
  } catch {
    return { ok: false, message: "Generi non disponibili." };
  }
}

// GET /steam/games/details?ids= on the API: card data for the given games (the API caches
// Steam's answers). Unknown games are left out.
export async function getGamesDetails(appIds: number[]): Promise<TopGamesReply> {
  if (!appIds.length) return { ok: true, data: [] };
  try {
    const req = await fetch(apiUrl("/steam/games/details?ids=" + appIds.join(",")), {
      signal: AbortSignal.timeout(30000),
    });
    if (!req.ok) return { ok: false, message: "Dettagli dei giochi non disponibili. Riprova." };
    return { ok: true, data: toTopGames(await req.json(), appIds.length) };
  } catch {
    return { ok: false, message: "Servizio Steam non raggiungibile. Controlla che l'API sia avviata." };
  }
}

// One game's card data from the API, or null when a field is missing or unsafe.
function toTopGame(row: unknown): TopGame | null {
  const r = (row ?? {}) as Record<string, unknown>;
  const text = (value: unknown, max: number): string | null =>
    typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
  const name = text(r.name, 200);
  const image = text(r.image, 500);
  // Only Steam's own image servers, as the page's content security policy allows.
  const safeImage = image && URL.canParse(image) && /^https:\/\/[a-z]+\.akamai\.steamstatic\.com\//.test(image);
  if (!Number.isSafeInteger(r.appId) || (r.appId as number) <= 0 || !name || !safeImage) return null;
  return {
    appId: r.appId as number,
    name,
    description: text(r.description, 300) ?? "",
    genres: (Array.isArray(r.genres) ? r.genres : []).filter((g): g is string => typeof g === "string").slice(0, 6),
    image: image as string,
  };
}

function toTopGames(rows: unknown, max: number): TopGame[] {
  return (Array.isArray(rows) ? rows.slice(0, max) : []).map(toTopGame).filter((game) => game !== null);
}
