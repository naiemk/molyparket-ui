/**
 *    struct Pool {
        uint256 id;
        address creator;
        uint256 closingTime;
        uint256 resolutionTime;
        SD59x18 b;
        SD59x18 nYes;
        SD59x18 nNo;
        uint256 totalSupplyYes;
        uint256 totalSupplyNo;
        uint256 collateral;
        Resolution resolution;
        string title;
        string resolutionPrompt;
        string discussionUrl;
        string tags;
        string logoUrl;
    }
 */

export enum Resolution {
  UNRESOLVED = "0",
  YES = "1", 
  NO = "2",
  INCONCLUSIVE = "3"
}

export function getResolutionString(resolution: Resolution | string) {
  switch (resolution) {
    case Resolution.YES:
      return "Yes";
    case Resolution.NO:
      return "No";
    case Resolution.INCONCLUSIVE:
      return "Inconclusive";
  }
}

export interface Pool {
  id: string;
  creator: string;
  closingTime: string;
  resolutionTime: string;
  b: string; // SD59x18 parameter
  nYes: string; // SD59x18 parameter
  nNo: string; // SD59x18 parameter
  totalSupplyYes: string;
  totalSupplyNo: string;
  collateral: string;
  resolution: Resolution | string;
  title: string;
  resolutionPrompt: string;
  discussionUrl: string;
  tags: string;
  logoUrl: string;
}

export interface AppConfig {
  chainId: string;
  betMarketContracts: {
    [key: string]: string;
  };
}

export const DEFAULT_CHAIN_ID = '8453';