import { DEFAULT_ICON } from "@/types/token";
import { useEffect, useState } from "react";
import { getChain, GlobalCache, NATIVE_TOKEN_ADDRESS, Token, useContracts, useErc20 } from "web3-react-ui";

const Balance = (props: {balance: string|null, symbol: string|null, error: string|null, lable?: React.ReactNode}) => {
  return (
    <div className="text-sm text-muted-foreground px-2">
      {props.lable ? props.lable : <span>Balance: </span>}{props.balance} {props.symbol} {props.error}
    </div>
  )
}

export const TokenBalance = ({token, userAddress, lable, onBalanceLoaded}: {
  token?: Token, userAddress?: string, lable?: React.ReactNode, onBalanceLoaded?: (token: Token, balance: bigint) => void}) => {
  const { toHumanReadable, tokenData, getBalance } = useErc20(token?.address, token?.chainId);
  const [balance, setBalance] = useState<string | null>(null);
  const { callMethod, error } = useContracts();
  useEffect(() => {
    if (tokenData && userAddress) {
      const _getBalance = async () => {
        try {
          const balanceRaw = await getBalance(userAddress);
          setBalance(toHumanReadable(balanceRaw || '0'))
          onBalanceLoaded?.(token!, balanceRaw || 0n);
        } catch (e) {
          console.error('Error getting balance', e)
        }
      }
      _getBalance()
    }
  }, [tokenData, userAddress,  callMethod, toHumanReadable, getBalance]);

  if (!token || !userAddress) {
    return <></>
  }

  return (
    <Balance balance={balance} symbol={token.symbol} error={error} lable={lable}/>
  )
}

export const TokenBalances = ({tokens, userAddress, lable, onBalanceLoaded}: 
  {tokens?: (Token | null)[], userAddress?: string, lable?: React.ReactNode,
  onBalanceLoaded?: (token: Token, balance: bigint) => void}) => {
  const handleBalanceLoaded = (token: Token, balance: bigint) => {
    onBalanceLoaded?.(token, balance)
  }
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground px-2">{lable ? lable : <span>Balance: </span>}</div>
      {tokens?.filter(Boolean).map((token, index) => <TokenBalance key={index} token={token!} userAddress={userAddress} lable={<></>}
        onBalanceLoaded={handleBalanceLoaded}/>)}
    </div>
  )
}

export function createDefaultToken(chainId: string): Token | null {
  const chain = getChain(chainId);
  if (!chain) {
    return null;
  }
  return {
    chainId: chainId,
    address: NATIVE_TOKEN_ADDRESS,
    symbol: chain.token || 'N/A',
    decimals: 18,
    isNative: true,
    name: chain.token || 'N/A',
    logoURI: chain.icon || DEFAULT_ICON
  }
}

export function findNativeToken(chainId: string, tokens: Token[]): Token | null {
  if (!chainId || !tokens || tokens.length === 0) {
    return null
  }
  let nt = GlobalCache.get(`NATIVE_TOKEN_${chainId}`) as Token | null;
  if (!nt) {
    nt = tokens.find(token => token.isNative && token.chainId == chainId) || createDefaultToken(chainId);
    if (nt) {
      GlobalCache.set(`NATIVE_TOKEN_${chainId}`, nt, { permStore: false, timeoutSeconds: 3600 });
    }
  }
  return nt;
}
