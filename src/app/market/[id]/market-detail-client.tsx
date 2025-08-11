"use client"

import { useState, useEffect } from "react"
import { Share, Bell, HelpCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { NostrComments } from "@/components/nostr-comments"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AppConfig, DEFAULT_CHAIN_ID, Pool } from "@/types/pool"
import { getPool, useMolyparket } from "@/hooks/use-molyparket"
import { useConnectWalletSimple, useErc20, useContracts } from "web3-react-ui"
import { GLOBAL_CONFIG } from "@/types/token"

import { TransactionModal } from "@/components/web3/transaction-modal"
import { weiToDecimal } from "@/lib/utils"
import { TradeControls } from "./trade-controls"

interface MarketDetailClientProps {
  id: string
}

export function MarketDetailClient({ id }: MarketDetailClientProps) {
  const { callMethod } = useContracts();
  let { chainId } = useConnectWalletSimple();
  if (!chainId) { // TODO: Get the default chainId from config
    chainId = DEFAULT_CHAIN_ID;
  }
  const { address } = useConnectWalletSimple();
  const [pool, setPool] = useState<Pool>({} as Pool);
  const { molyparketInfo } = useMolyparket();
  const [copied, setCopied] = useState(false)
  const { toHumanReadable, getBalance } = useErc20(molyparketInfo?.collateralTokenAddress || "", chainId!);
  const [yesPrice, setYesPrice] = useState<string>("");
  const [noPrice, setNoPrice] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [yesBalance, setYesBalance] = useState<string>("");
  const [noBalance, setNoBalance] = useState<string>("");
  const volume = toHumanReadable(pool.collateral || "0");
  const totalYesNo = BigInt(pool.totalSupplyYes || '0') + BigInt(pool.totalSupplyNo || '0');
  const percentage = totalYesNo > 0 ?
    100n * BigInt(pool.totalSupplyYes) / totalYesNo : 0n;
  const appConfig = GLOBAL_CONFIG['APP'] as AppConfig || {};
  const contractAddress = (appConfig?.betMarketContracts || [])[chainId || 'N/A'] || '';

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  console.log('POOL', pool, id, molyparketInfo?.collateralTokenAddress)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") {
      return new Set()
    }
    const savedFavorites = localStorage.getItem("favoriteMarkets")
    return savedFavorites ? new Set(JSON.parse(savedFavorites)) : new Set()
  })
  const referralLink = `https://molyparket.com/market/${id}${address ? `?r=${address}` : ''}`

  useEffect(() => {
    localStorage.setItem("favoriteMarkets", JSON.stringify(Array.from(favorites)))
  }, [favorites])

  // effect to load the pool using getPool
  useEffect(() => {
    if (!chainId || !contractAddress) return;
    const loadPool = async () => {
      const pool = await getPool(chainId, contractAddress, id, callMethod)
      setPool(pool)
    }
    loadPool()
  }, [id, chainId, contractAddress, callMethod])

  useEffect(() => {
    if (!chainId || !contractAddress) return;
    const loadYesPrice = async () => {
      const yesPrice = await callMethod(chainId, contractAddress, "function costToBuyYes(uint256,uint256) view returns (uint256)", [id, BigInt(10 ** 18)])
      // Convert wei to human-readable decimal price
      const humanReadablePrice = weiToDecimal(yesPrice)
      console.log('yesPrice', yesPrice, humanReadablePrice, id)
      setYesPrice(humanReadablePrice)
    } 
    loadYesPrice()
  }, [chainId, contractAddress, callMethod, id])

  useEffect(() => {
    if (!chainId || !contractAddress) return;
    const loadNoPrice = async () => {
      const noPrice = await callMethod(chainId, contractAddress, "function costToBuyNo(uint256,uint256) view returns (uint256)", [id, 1n * BigInt(10 ** 18)])
      // Convert wei to human-readable decimal price
      const humanReadablePrice = weiToDecimal(noPrice)
      setNoPrice(humanReadablePrice)
    } 
    loadNoPrice()
  }, [chainId, contractAddress, callMethod, id])

  useEffect(() => {
    if (!chainId || !contractAddress || !address) return;
    const loadYesBalance = async () => {
      const yesBalance = await callMethod(chainId, contractAddress, "function yesBalances(uint256,address) view returns (uint256)", [id, address])
      // Convert wei to human-readable decimal balance
      const humanReadableBalance = weiToDecimal(yesBalance)
      setYesBalance(humanReadableBalance)
    } 
    loadYesBalance()
  }, [chainId, contractAddress, callMethod, id, address])

  useEffect(() => {
    if (!chainId || !contractAddress || !address) return;
    const loadNoBalance = async () => {
      const noBalance = await callMethod(chainId, contractAddress, "function noBalances(uint256,address) view returns (uint256)", [id, address])
      // Convert wei to human-readable decimal balance
      const humanReadableBalance = weiToDecimal(noBalance)
      setNoBalance(humanReadableBalance)
    } 
    loadNoBalance()
  }, [chainId, contractAddress, callMethod, id, address])

  useEffect(() => {
    if (!address) return;
    const loadBalance = async () => {
      const balance = await getBalance(address)
      setBalance(toHumanReadable(balance) || '')
    }
    loadBalance()
  }, [getBalance, address, toHumanReadable])

  const handleToggleFavorite = (marketId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(marketId)) {
      newFavorites.delete(marketId)
    } else {
      newFavorites.add(marketId)
    }
    setFavorites(newFavorites)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onTransactionSubmitted = (tx: { hash: string }) => {
    if (!tx?.hash) return;
    console.log('transaction submitted:', tx);
    setTransactionId(tx.hash)
    setIsTransactionModalOpen(true)
  }



  const isFavorite = favorites.has(pool.id)
  return (
    <div className="min-h-screen bg-background">
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        transactionId={transactionId || ''}
        chainId={chainId || ''}
      />
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Market Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={pool.logoUrl || "/placeholder.svg"} />
                  <AvatarFallback>F</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{pool.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <span>{volume}</span>
                    <span>📅 {pool.closingTime}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Share className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  onClick={() => handleToggleFavorite(pool.id)}
                >
                  <Bell className={`w-4 h-4 ${isFavorite ? "fill-current text-primary" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Current Odds */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-blue-600">{percentage}%</span>
                <span className="text-lg text-muted-foreground">chance</span>
                {/* <Badge variant="secondary" className="text-green-600 bg-green-500/10 border-transparent">
                  {marketData.change}
                </Badge> */}
              </div>
            </div>

            {/* Chart */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  {/* Yes Bar */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-foreground">Yes</span>
                      <span className="text-muted-foreground">{weiToDecimal(pool.totalSupplyYes)}</span>
                    </div>
                    <span className="font-semibold text-foreground">{percentage}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>

                <div className="space-y-2">
                  {/* No Bar */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-foreground">No</span>
                      <span className="text-muted-foreground">{weiToDecimal(pool.totalSupplyNo)}</span>
                    </div>
                    <span className="font-semibold text-foreground">{100 - Number(percentage)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div
                      className="bg-pink-500 h-2.5 rounded-full"
                      style={{ width: `${100 - Number(percentage)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 space-y-6">
              {/* Order Book, Context, Rules */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Rules</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    <pre className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap break-words">
                      {pool.resolutionPrompt}
                    </pre>
                  </p>
                  {/* <Button variant="link" size="sm" className="text-blue-600 p-0">
                    Show more
                  </Button> */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-foreground mb-2">AI Model</h4>
                    <p className="text-sm text-muted-foreground font-mono">system, openai-gpt-o3-simple-text</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Nostr Comments */}
            <NostrComments noteUrl={pool.discussionUrl} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <TradeControls
              pool={pool}
              molyparketInfo={molyparketInfo}
              chainId={chainId}
              contractAddress={contractAddress}
              yesPrice={yesPrice}
              noPrice={noPrice}
              balance={balance}
              yesBalance={yesBalance}
              noBalance={noBalance}
              onTransactionSubmitted={onTransactionSubmitted}
            />

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Referrals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Your referral rewards</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Make money by sharing the bet using your referral links. 0.1% of every bet amount made from
                            your referral link will be paid to you as reward.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-semibold text-foreground">$0</span>
                </div>
                {address ? (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Your referral link</label>
                  <div className="flex items-center space-x-2">
                    <Input readOnly value={referralLink} className="bg-secondary border-none" />
                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  {copied && <p className="text-xs text-green-600">Copied to clipboard!</p>}
                </div>
                ): (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Connect your wallet to see your referral rewards</label>
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 