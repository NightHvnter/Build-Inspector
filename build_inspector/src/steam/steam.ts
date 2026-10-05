
export interface ISteamSearchItem {
  id: number;
  name: string;
}
 
export interface ISteamSearchResponse {
  total: number;
  items: ISteamSearchItem[];
}
 
export interface IRequirements {
  minimum?: string;
  recommended?: string;
}
 
export interface IGameDetails {
  name: string;
  pcreq: IRequirements | []; 
}
 
export interface ISteamDetailsResponse {
  [appId: string]: {
    success: boolean;
    data?: IGameDetails;
  };
}