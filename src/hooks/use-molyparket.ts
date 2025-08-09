import { AppConfig, Pool } from "@/types/pool";
import { GLOBAL_CONFIG } from "@/types/token";
import { useEffect, useState } from "react";
import { GlobalCache, Token, useConnectWalletSimple, useContracts } from "web3-react-ui";

const PAGE_SIZE = 40;

interface BetSummary {
    yesSupply: string;
    noSupply: string;
    collateral: string;
    resolution: string;
}

export interface MolyparketInfo {
    collateralTokenAddress: string;
    collateralToken: Token;
    poolCount: number;
    pools: Pool[]; // in Reverse order
    keywordsSorted: string[];
    keywords: { [key: string]: number };
}

export async function getPool(chainId: string, contractAddress: string, id: string,
    callMethod: (chainId: string, contractAddress: string, method: string, params: unknown[]) => Promise<unknown>) {
    const res = await callMethod(chainId, contractAddress,
        /*
            struct Pool {
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
        `function pools(uint256 index) view returns (
                uint256,
                address,
                uint256,
                uint256,
                int256,
                int256,
                int256,
                uint256,
                uint256,
                uint256,
                uint256,
                uint8,
                string,
                string,
                string,
                string,
                string)
        `,
        [id]) as string[];
    return {
        id: res[0],
        creator: res[1],
        closingTime: res[2],
        resolutionTime: res[3],
        totalSupplyYes: res[7].toString(),
        totalSupplyNo: res[8].toString(),
        collateral: res[9].toString(),
        resolution: res[10].toString(),
        title: res[11],
        resolutionPrompt: res[12],
        discussionUrl: res[13],
        tags: res[14],
        logoUrl: res[15],
    } as Pool;
}

/**
 * Load global molyparket contract information
 */
export function useMolyparket(lookBack: number = PAGE_SIZE) {
    const { chainId } = useConnectWalletSimple();
    const { callMethod, error } = useContracts();
    const [collateralTokenAddress, setCollateralTokenAddress] = useState<string>('');
    // const { toHumanReadable, tokenData, getBalance } = useErc20(collateralToken, chainId!);
    const appConfig = GLOBAL_CONFIG['APP'] as AppConfig || {};
    const contractAddress = appConfig.betMarketContracts[chainId || 'N/A'] || '';
    const [poolCount, setPoolCount] = useState<number>(0);
    const [pools, setPools] = useState<{ [key: string]: Pool }>({});
    const [molyparketInfo, setMolyparketInfo] = useState<MolyparketInfo>({} as MolyparketInfo);
    const [betSummaries, setBetSummaries] = useState<{ [key: string]: BetSummary }>({});
    useEffect(() => {
        if (!chainId || !contractAddress) {
            return;
        }
        const getGeneralInfo = async () => {
            const collateralTokenAddress = await GlobalCache.getAsync(`${chainId}-${contractAddress}-collateralToken`,
                () => callMethod(chainId, contractAddress, 'function collateralToken() view returns (address)', []));
            setCollateralTokenAddress(collateralTokenAddress);
            // poolCount cannot be cached
            const poolCount = await callMethod(chainId, contractAddress, 'function poolCount() view returns (uint256)', []);
            setPoolCount(poolCount);
        }
        getGeneralInfo();
    }, [chainId, contractAddress, callMethod]);

    // Load recent pools until lookBack is reached. Use cache to avoid duplicate calls.
    useEffect(() => {
        if (!poolCount || !chainId || !contractAddress) {
            return;
        }
        const getPools = async (startIndex: number) => {
            for (let i = startIndex; i < startIndex + lookBack; i++) {
                const pool = await GlobalCache.getAsync(`${chainId}-${contractAddress}-pool-${i}`, async () =>
                    getPool(chainId, contractAddress, i.toString(), callMethod));
                setPools({ ...pools, [i.toString()]: pool });
            }
        }
        getPools(Math.max(0, poolCount - lookBack));
    }, [poolCount, chainId, contractAddress, callMethod, pools, lookBack]);

    /*
    function getBetSummaries(uint256[] memory _betIds) external view returns (
        uint256[] memory _yesSupply, uint256[] memory _noSupply, uint256[] memory _collaterals, uint8[] memory _resolutions);
    Load bet summaries in bulk and update pools with these values
    */
    useEffect(() => {
        if (!poolCount || !chainId || !contractAddress) {
            return;
        }
        const getBetSummaries = async () => {
            const betIds = Object.keys(pools).map(Number);
            const betSummaries = await callMethod(chainId, contractAddress,
                `function getBetSummaries(uint256[] memory _betIds) external view returns (
                    uint256[] memory _yesSupply,
                    uint256[] memory _noSupply,
                    uint256[] memory _collaterals,
                    uint8[] memory _resolutions
                )`,
                [betIds]);
            const newSummaries: { [key: string]: BetSummary } = {};
            betSummaries.forEach((summary: [string, string, string, string], index: number) => {
                newSummaries[betIds[index].toString()] = {
                    yesSupply: summary[0].toString(),
                    noSupply: summary[1].toString(),
                    collateral: summary[2].toString(),
                    resolution: summary[3].toString(),
                };
            });
            setBetSummaries({ ...betSummaries, ...newSummaries });
        }
        getBetSummaries();
    }, [poolCount, chainId, contractAddress, callMethod, pools, lookBack, betSummaries]);

    useEffect(() => {
        if (!collateralTokenAddress || !poolCount) {
            return;
        }
        // update pools with bet summaries
        const newPools = Object.values(pools).map((pool) => ({
            ...pool,
            ...(betSummaries[pool.id.toString()] || {}),
        }));
        // Create keywords from tag.split(',').replace(/ /g, '').split(',') and count them sort by count.
        const keywords = Object.values(newPools).map((pool) => pool.tags.split(',').map(
            (tag) => tag.trim())).flat().filter((tag) => tag !== '').reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        const keywordsSorted = Object.keys(keywords).sort((a, b) => keywords[b] - keywords[a]);
        setMolyparketInfo({
            ...(molyparketInfo),
            collateralTokenAddress: collateralTokenAddress,
            poolCount: poolCount,
            pools: Object.values(newPools).sort((a, b) => Number(b.id) - Number(a.id)),
            keywordsSorted: keywordsSorted,
            keywords: keywords,
        });
    }, [collateralTokenAddress, molyparketInfo, poolCount, pools, betSummaries]);

    return { molyparketInfo, error };
}
