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

export interface Pool {
  id: string;
  creator: string;
  closingTime: string;
  resolutionTime: string;
  totalSupplyYes: string;
  totalSupplyNo: string;
  collateral: string;
  resolution: string;
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