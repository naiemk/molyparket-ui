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
import { AppConfig, Pool } from "@/types/pool"
import { getPool, useMolyparket } from "@/hooks/use-molyparket"
import { useConnectWalletSimple, useContracts, useErc20 } from "web3-react-ui"
import { ZeroAddress } from "ethers"
import { GLOBAL_CONFIG } from "@/types/token"
import { useSearchParams } from "next/navigation"
import { TransactionModal } from "@/components/web3/transaction-modal"

interface MarketDetailClientProps {
  id: string
}

export function MarketDetailClient({ id }: MarketDetailClientProps) {
  const { callMethod, error, execute } = useContracts();
  const { chainId, address } = useConnectWalletSimple();
  const [pool, setPool] = useState<Pool>({} as Pool);
  const { molyparketInfo } = useMolyparket();
  const [betType, setBetType] = useState<"Buy" | "Sell">("Buy")
  const [selectedOutcome, setSelectedOutcome] = useState<"Yes" | "No">("Yes")
  const [amount, setAmount] = useState("")
  const [copied, setCopied] = useState(false)
  const { toHumanReadable, getBalance, toMachineReadable } = useErc20(molyparketInfo?.collateralTokenAddress || "", chainId!);
  const [yesPrice, setYesPrice] = useState<string>("");
  const [noPrice, setNoPrice] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const volume = toHumanReadable(pool.collateral || "0");
  const totalYesNo = BigInt(pool.totalSupplyYes || '0') + BigInt(pool.totalSupplyNo || '0');
  const percentage = totalYesNo > 0 ?
    100n * BigInt(pool.totalSupplyYes) / totalYesNo : 0n;
  const appConfig = GLOBAL_CONFIG['APP'] as AppConfig || {};
  const contractAddress = appConfig.contractAddress || '';
  const searchParams = useSearchParams()
  const referrer = searchParams.get('r') || '';
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") {
      return new Set()
    }
    const savedFavorites = localStorage.getItem("favoriteMarkets")
    return savedFavorites ? new Set(JSON.parse(savedFavorites)) : new Set()
  })
  const referralLink = `https://molyparket.com/market/${id}?r=${address}`

  useEffect(() => {
    localStorage.setItem("favoriteMarkets", JSON.stringify(Array.from(favorites)))
  }, [favorites])

  // effect to load the pool using getPool
  useEffect(() => {
    if (!chainId || !molyparketInfo?.collateralTokenAddress) return;
    const loadPool = async () => {
      const pool = await getPool(chainId, molyparketInfo.collateralTokenAddress, id, callMethod)
      setPool(pool)
    }
    loadPool()
  }, [id, chainId, molyparketInfo?.collateralTokenAddress, callMethod])

  useEffect(() => {
    if (!chainId || !molyparketInfo?.collateralTokenAddress) return;
    const loadYesPrice = async () => {
      const yesPrice = await callMethod(chainId, molyparketInfo.collateralTokenAddress, "costToBuyYes", [id, 1n * BigInt(10 ** 18)])
      setYesPrice(yesPrice)
    } 
    loadYesPrice()
  }, [chainId, molyparketInfo?.collateralTokenAddress, callMethod, id, amount])

  useEffect(() => {
    if (!chainId || !molyparketInfo?.collateralTokenAddress) return;
    const loadNoPrice = async () => {
      const noPrice = await callMethod(chainId, molyparketInfo.collateralTokenAddress, "costToBuyNo", [id, 1n * BigInt(10 ** 18)])
      setNoPrice(noPrice)
    } 
    loadNoPrice()
  }, [chainId, molyparketInfo?.collateralTokenAddress, callMethod, id, amount])

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

  const onTransactionSubmitted = (tx: string) => {
    console.log('transaction submitted:', tx);
    setTransactionId(tx)
    setIsTransactionModalOpen(true)
  }

  const handleTrade = async () => {
    if (!address || !chainId || !contractAddress) return;
    const amountInWei = toMachineReadable(amount);
    if (betType === "Buy") {
      if (selectedOutcome === "Yes") {
        //     external 
        const tx = await execute(
          contractAddress, 'function buyYes(uint256 poolId, uint256 amount, address referrer)',
          [id, amountInWei, referrer || ZeroAddress], {gasLimit: 1000000, wait: true});
        console.log('buy yes transaction:', tx);
        onTransactionSubmitted(tx)
      } else {
        const tx = await execute(
          contractAddress, 'function buyNo(uint256 poolId, uint256 amount, address referrer)',
          [id, amountInWei, referrer || ZeroAddress], {gasLimit: 1000000, wait: true});
        console.log('buy no transaction:', tx);
        onTransactionSubmitted(tx)
      }
    } else {
      if (selectedOutcome === "Yes") {
        //     function sellYes(uint256 poolId, uint256 amount, address referrer) external {
        const tx = await execute(
          contractAddress, 'function sellYes(uint256 poolId, uint256 amount)',
          [id, amountInWei], {gasLimit: 1000000, wait: true});
        console.log('sell yes transaction:', tx);
        onTransactionSubmitted(tx)
      } else {
        //     function sellNo(uint256 poolId, uint256 amount) external {
        const tx = await execute(
          contractAddress, 'function sellNo(uint256 poolId, uint256 amount)',
          [id, amountInWei], {gasLimit: 1000000, wait: true});
        console.log('sell no transaction:', tx);
        onTransactionSubmitted(tx)
      }
    }
  }

  console.log('pool', pool)

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
            {error && <div className="text-red-500">{error}</div>}
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
                      <span className="text-muted-foreground">{pool.totalSupplyYes}</span>
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
                      <span className="text-muted-foreground">{pool.totalSupplyNo}</span>
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
                    {pool.resolutionPrompt}
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
            <NostrComments noteId={pool.discussionUrl} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1 bg-secondary p-1 rounded-md">
                    <Button
                      variant={betType === "Buy" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setBetType("Buy")}
                      className={`w-16 ${
                        betType === "Buy" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Buy
                    </Button>
                    <Button
                      variant={betType === "Sell" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setBetType("Sell")}
                      className={`w-16 ${
                        betType === "Sell" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Sell
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-2 mb-4">
                  <Button
                    variant={selectedOutcome === "Yes" ? "default" : "outline"}
                    className="flex-1 h-12 text-base bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20 data-[state=active]:bg-green-500 data-[state=active]:text-white"
                    onClick={() => setSelectedOutcome("Yes")}
                    data-state={selectedOutcome === "Yes" ? "active" : "inactive"}
                  >
                    Yes {yesPrice}
                  </Button>
                  <Button
                    variant={selectedOutcome === "No" ? "default" : "outline"}
                    className="flex-1 h-12 text-base bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 data-[state=active]:bg-red-500 data-[state=active]:text-white"
                    onClick={() => setSelectedOutcome("No")}
                    data-state={selectedOutcome === "No" ? "active" : "inactive"}
                  >
                    No {noPrice}
                  </Button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Amount (Balance: USDT {balance})</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-2xl">
                      $
                    </span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="pl-8 text-2xl h-12"
                    />
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => setAmount("1")}>
                      +$1
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAmount("20")}>
                      +$20
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAmount("100")}>
                      +$100
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAmount(balance)}>
                      Max
                    </Button>
                  </div>
                </div>

                <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white mb-4"
                  onClick={handleTrade} >Trade</Button>

                <p className="text-xs text-muted-foreground text-center">
                  By trading, you agree to the <span className="text-blue-600 underline">Terms of Use</span>
                </p>
              </CardContent>
            </Card>

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
                  <span className="font-semibold text-foreground">$20.03</span>
                </div>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 