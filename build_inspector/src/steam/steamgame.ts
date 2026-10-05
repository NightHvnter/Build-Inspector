export interface ISteamSearchItem {
  id: number;
  name: string;
}
 
interface ISteamSearchResponse {
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
 
interface ISteamDetailsResponse {
  [appId: string]: {
    success: boolean;
    data?: IGameDetails;
  };
}