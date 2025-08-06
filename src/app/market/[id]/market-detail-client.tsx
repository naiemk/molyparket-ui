"use client"

import { useState, useEffect } from "react"
import { Share, Bell, ChevronDown, Info, HelpCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { NostrComments } from "@/components/nostr-comments"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Mock data for the market
const marketData = {
  id: 1,
  title: "Fed rate cut in 2025?",
  icon: "/placeholder.svg?height=40&width=40",
  volume: "$769,882 Vol.",
  endDate: "Dec 31, 2025",
  currentOdds: 91,
  change: "+2%",
  yesPrice: "92¢",
  noPrice: "10¢",
  chartData: [
    { time: "May", value: 85 },
    { time: "Jun", value: 88 },
    { time: "Jul", value: 91 },
    { time: "Aug", value: 89 },
  ],
  nostrNoteId: "note10c9fb11f742e6dc05d8bbcb4af790a4453f1bc046e40ca1b5385996c63d93ba",
  referralLink: "https://molyparket.com/r/user123",
}

interface MarketDetailClientProps {
  id: string
}

export function MarketDetailClient({ id }: MarketDetailClientProps) {
  console.log(id)
  const [betType, setBetType] = useState<"Buy" | "Sell">("Buy")
  const [selectedOutcome, setSelectedOutcome] = useState<"Yes" | "No">("Yes")
  const [amount, setAmount] = useState("")
  const [copied, setCopied] = useState(false)
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    if (typeof window === "undefined") {
      return new Set()
    }
    const savedFavorites = localStorage.getItem("favoriteMarkets")
    return savedFavorites ? new Set(JSON.parse(savedFavorites)) : new Set()
  })

  useEffect(() => {
    localStorage.setItem("favoriteMarkets", JSON.stringify(Array.from(favorites)))
  }, [favorites])

  const handleToggleFavorite = (marketId: number) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(marketId)) {
      newFavorites.delete(marketId)
    } else {
      newFavorites.add(marketId)
    }
    setFavorites(newFavorites)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(marketData.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isFavorite = favorites.has(marketData.id)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Market Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={marketData.icon || "/placeholder.svg"} />
                  <AvatarFallback>F</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{marketData.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <span>{marketData.volume}</span>
                    <span>📅 {marketData.endDate}</span>
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
                  onClick={() => handleToggleFavorite(marketData.id)}
                >
                  <Bell className={`w-4 h-4 ${isFavorite ? "fill-current text-primary" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Current Odds */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-blue-600">{marketData.currentOdds}%</span>
                <span className="text-lg text-muted-foreground">chance</span>
                <Badge variant="secondary" className="text-green-600 bg-green-500/10 border-transparent">
                  {marketData.change}
                </Badge>
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
                      <span className="text-muted-foreground">{marketData.yesPrice}</span>
                    </div>
                    <span className="font-semibold text-foreground">{marketData.currentOdds}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${marketData.currentOdds}%` }} />
                  </div>
                </div>

                <div className="space-y-2">
                  {/* No Bar */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-foreground">No</span>
                      <span className="text-muted-foreground">{marketData.noPrice}</span>
                    </div>
                    <span className="font-semibold text-foreground">{100 - marketData.currentOdds}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div
                      className="bg-pink-500 h-2.5 rounded-full"
                      style={{ width: `${100 - marketData.currentOdds}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 space-y-6">
              {/* Order Book, Context, Rules */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-foreground">Order Book</h3>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Market Context</h3>
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 bg-transparent">
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Rules</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This market will resolve to &quot;Yes&quot; if the upper bound of the target federal funds rate is decreased
                    at any point between March 4 and December 31, 2025.
                  </p>
                  <Button variant="link" size="sm" className="text-blue-600 p-0">
                    Show more
                  </Button>
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-foreground mb-2">AI Model</h4>
                    <p className="text-sm text-muted-foreground font-mono">system, openai-gpt-o3-simple-text</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Nostr Comments */}
            <NostrComments noteId={marketData.nostrNoteId} />
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
                  <Button variant="ghost" className="flex items-center space-x-1 text-muted-foreground">
                    <span className="text-sm">Market</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex space-x-2 mb-4">
                  <Button
                    variant={selectedOutcome === "Yes" ? "default" : "outline"}
                    className="flex-1 h-12 text-base bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20 data-[state=active]:bg-green-500 data-[state=active]:text-white"
                    onClick={() => setSelectedOutcome("Yes")}
                    data-state={selectedOutcome === "Yes" ? "active" : "inactive"}
                  >
                    Yes {marketData.yesPrice}
                  </Button>
                  <Button
                    variant={selectedOutcome === "No" ? "default" : "outline"}
                    className="flex-1 h-12 text-base bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 data-[state=active]:bg-red-500 data-[state=active]:text-white"
                    onClick={() => setSelectedOutcome("No")}
                    data-state={selectedOutcome === "No" ? "active" : "inactive"}
                  >
                    No {marketData.noPrice}
                  </Button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Amount</label>
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
                    <Button variant="outline" size="sm">
                      Max
                    </Button>
                  </div>
                </div>

                <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white mb-4">Trade</Button>

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
                    <Input readOnly value={marketData.referralLink} className="bg-secondary border-none" />
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