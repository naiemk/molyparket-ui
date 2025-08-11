import { AppConfig, DEFAULT_CHAIN_ID, Pool } from "@/types/pool";
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
    console.log('pools', chainId, contractAddress, id, callMethod)
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
                uint8,
                string,
                string,
                string,
                string,
                string)`,
        [id]) as string[];
    console.log('getPool.res', res, id)
    if (!res) {
        throw new Error(`Pool ${id} not found`)
    }
    console.log('getPool.res', res, id)
    const poolObj = {
        id: res[0].toString(),
        creator: res[1].toString(),
        closingTime: res[2].toString(),
        resolutionTime: res[3].toString(),
        b: res[4].toString(),
        nYes: res[5].toString(),
        nNo: res[6].toString(),
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
    console.log('GETPOOL.RES', poolObj, id)
    return poolObj;
}

/**
 * Load global molyparket contract information
 */
export function useMolyparket(lookBack: number = PAGE_SIZE) {
    let { chainId } = useConnectWalletSimple();
    if (!chainId) { // TODO: Get the default chainId from config
        chainId = DEFAULT_CHAIN_ID;
    }
    const { callMethod, error } = useContracts();
    const [collateralTokenAddress, setCollateralTokenAddress] = useState<string>('');
    const appConfig = GLOBAL_CONFIG['APP'] as AppConfig || {};
    const contractAddress = (appConfig?.betMarketContracts || [])[chainId || 'N/A'] || '';
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
            const poolCount = await callMethod(chainId, contractAddress, 'function betIdsLength() view returns (uint256)', []);
            setPoolCount(poolCount);
        }
        getGeneralInfo();
    }, [chainId, contractAddress, callMethod]);

    // Load recent pools until lookBack is reached. Use cache to avoid duplicate calls.
    useEffect(() => {
        if (!poolCount || !chainId || !contractAddress) {
            return;
        }
        const getPools = async (startIndex: number, endIndex: number) => {
            try {
                    console.log('getPools', startIndex, endIndex)
                    for (let i = startIndex; i <= endIndex; i++) {
                        console.log('getPools.for', i)
                        const poolId = await GlobalCache.getAsync(`${chainId}-${contractAddress}-betId-${i}`, 
                                async () => (await callMethod(
                                    chainId, contractAddress, 'function betIds(uint256 index) view returns (uint256)', [i])).toString());
                        console.log('getPools.poolId', i, poolId)
                        if (!poolId) {
                            throw new Error(`Bet ID ${i} not found`)
                        }
                        const pool = await GlobalCache.getAsync(`${chainId}-${contractAddress}-pool-${poolId}`, async () =>
                            await getPool(chainId, contractAddress, poolId.toString(), callMethod));
                        console.log('GOT pool', i, pool)
                        setPools(prevPools => ({ ...prevPools, [poolId]: pool }));
                    }
            } catch (error) {
                console.error('Error getting pools', startIndex, endIndex, error)
            }
        }
        getPools(Math.max(0, Number(poolCount) - lookBack), Number(poolCount) - 1);
    }, [poolCount, chainId, contractAddress, callMethod, lookBack]);

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
            console.log('betIds', betIds, pools)
            if (betIds.length === 0) {
                return;
            }
            const betSummaries = await callMethod(chainId, contractAddress,
                `function getBetSummaries(uint256[] memory _betIds) external view returns (
                    uint256[] memory _yesSupply,
                    uint256[] memory _noSupply,
                    uint256[] memory _collaterals,
                    uint8[] memory _resolutions
                )`,
                [betIds]);
            console.log('betSummaries', betSummaries, betIds)
            const newSummaries: { [key: string]: BetSummary } = {};
            const yesSupply = betSummaries[0];
            const noSupply = betSummaries[1];
            const collaterals = betSummaries[2];
            const resolutions = betSummaries[3];
            for (let i = 0; i < betIds.length; i++) {
                newSummaries[betIds[i].toString()] = {
                    yesSupply: yesSupply[i].toString(),
                    noSupply: noSupply[i].toString(),
                    collateral: collaterals[i].toString(),
                    resolution: resolutions[i].toString(),
                }
            }
            setBetSummaries(prevBets => ({ ...prevBets, ...newSummaries }));
        }
        getBetSummaries();
    }, [poolCount, chainId, contractAddress, callMethod, pools, lookBack]);

    useEffect(() => {
        if (!collateralTokenAddress || poolCount === undefined) {
            return;
        }
        // update pools with bet summaries
        const newPools = Object.values(pools).map((pool) => {
            const bs  = betSummaries[pool.id.toString()] || {};
            return ({
            ...pool,
            totalSupplyYes: bs.yesSupply || pool.totalSupplyYes,
            totalSupplyNo: bs.noSupply || pool.totalSupplyNo,
            collateral: bs.collateral || pool.collateral,
            resolution: bs.resolution || pool.resolution,
            }); 
        });
        // Create keywords from tag.split(',').replace(/ /g, '').split(',') and count them sort by count.
        const keywords = Object.values(newPools).map((pool) => pool.tags.split(',').map(
            (tag) => tag.trim())).flat().filter((tag) => tag !== '').reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        const keywordsSorted = Object.keys(keywords).sort((a, b) => keywords[b] - keywords[a]);
        console.log('Updating MOLY PARKET',  collateralTokenAddress, poolCount, pools, betSummaries)
        setMolyparketInfo(prevInfo => ({
            ...(prevInfo),
            collateralTokenAddress: collateralTokenAddress,
            poolCount: poolCount,
            pools: Object.values(newPools).sort((a, b) => Number(b.id) - Number(a.id)),
            keywordsSorted: keywordsSorted,
            keywords: keywords,
        }));
    }, [collateralTokenAddress, poolCount, pools, betSummaries]);

    return { molyparketInfo, error };
}
