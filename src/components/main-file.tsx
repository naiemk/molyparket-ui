"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { useMolyparket } from "@/hooks/use-molyparket"
import PoolCard from "./pool-card"
import { useConnectWalletSimple } from "web3-react-ui"

// const categories = [
//   "All",
//   "Epstein",
//   "Breaking News",
//   "Trump Presidency",
//   "Israel",
//   "Jerome Powell",
//   "Ghislaine Maxwell",
//   "Thailand-Cambodia",
//   "US Elections",
// ]

export default function PolymarketClone() {
  const { molyparketInfo } = useMolyparket();
  const { chainId } = useConnectWalletSimple();
  const categories = molyparketInfo?.keywordsSorted || [];
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const markets = molyparketInfo?.pools || [];
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") {
      return new Set()
    }
    const savedFavorites = localStorage.getItem("favoriteMarkets")
    return savedFavorites ? new Set(JSON.parse(savedFavorites)) : new Set()
  })

  useEffect(() => {
    localStorage.setItem("favoriteMarkets", JSON.stringify(Array.from(favorites)))
  }, [favorites])

  const handleFav = (marketId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(marketId)) {
      newFavorites.delete(marketId)
    } else {
      newFavorites.add(marketId)
    }
    setFavorites(newFavorites)
  }

  const filteredMarkets = showFavoritesOnly ? markets.filter((market) => favorites.has(market.id)) : markets

  return (
    <div className="min-h-screen bg-background">
    <Header onBellClick={() => setShowFavoritesOnly(!showFavoritesOnly)} isFavoritesActive={showFavoritesOnly} />
    {/* Search and Filters */}
      <div className="border-b border-border px-4 py-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search" className="pl-10" />
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Menu className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {categories.map((category, index) => (
              <Badge
                key={category}
                variant={index === 0 ? "default" : "secondary"}
                className="whitespace-nowrap cursor-pointer"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Markets Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map((market, i) => ( <PoolCard
              key={i}
              pool={market}
              chainId={chainId || ''}
              tokenContract={molyparketInfo?.collateralTokenAddress || ""}
              fav={favorites.has(market.id)} favClicked={handleFav} /> ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p>No favorite markets found.</p>
              <p className="text-sm">Click the bell icon on a market card to add it to your favorites.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
