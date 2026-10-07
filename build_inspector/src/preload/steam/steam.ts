export interface IGameDetails {
  type: string;
  name: string;
  steam_appid: number;
  about_the_game: string;
  short_description: string;
  website: string | null;

  pc_requirements: IRequirements | [];
  mac_requirements: IRequirements | [];
  linux_requirements: IRequirements | [];

  developers?: string[];
  publishers?: string[];
  platforms: { windows: boolean; mac: boolean; linux: boolean };
  categories?: { id: number; description: string }[];
  genres?: { id: string; description: string }[];
  release_date: { coming_soon: boolean; date: string };
}

export interface IRequirements {
  minimum?: string;    
  recommended?: string;  
}


export interface ISteamSearchResponse {
  total: number;
  items: ISteamSearchItem[];
}

export interface ISteamSearchItem {
  type: string;
  name: string;
  id: number;
  platforms: { windows: boolean; mac: boolean; linux: boolean };
}