"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { Search, Menu, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Header } from "@/components/header"
import { useMolyparket } from "@/hooks/use-molyparket"

const markets = [
  {
    id: 1,
    title: "Will Ghislaine Maxwell cut a deal with the Fed...",
    percentage: 34,
    volume: "$6k Vol.",
    avatar: "/placeholder.svg?height=32&width=32",
    outcomes: [
      { name: "Yes", percentage: 34, color: "green" },
      { name: "No", percentage: 66, color: "red" },
    ],
  },
  {
    id: 2,
    title: "Presidential Election Winner 2028",
    percentage: 28,
    volume: "$2m Vol.",
    avatar: "/placeholder.svg?height=32&width=32",
    outcomes: [
      { name: "JD Vance", percentage: 28 },
      { name: "Gavin Newsom", percentage: 14 },
      { name: "Alexandria Ocasio-Cortez", percentage: 11 },
    ],
  },
  {
    id: 3,
    title: "Jerome Powell out as Fed Chair in 2025?",
    percentage: 14,
    volume: "$7m Vol.",
    avatar: "/placeholder.svg?height=32&width=32",
    outcomes: [
      { name: "Yes", percentage: 14, color: "green" },
      { name: "No", percentage: 86, color: "red" },
    ],
  },
  {
    id: 4,
    title: "Fed decision in July?",
    percentage: 1,
    volume: "$82m Vol.",
    avatar: "/placeholder.svg?height=32&width=32",
    outcomes: [
      { name: "50+ bps decrease", percentage: 1 },
      { name: "25 bps decrease", percentage: 4 },
      { name: "No change", percentage: 95 },
    ],
  },
  {
    id: 5,
    title: "New York City Mayoral Election",
    percentage: 73,
    volume: "$37m Vol.",
    avatar: "/placeholder.svg?height=32&width=32",
    outcomes: [
      { name: "Zohran Mamdani", percentage: 73 },
      { name: "Andrew Cuomo", percentage: 14 },
      { name: "Eric Adams", percentage: 6 },
    ],
  },
  {
    id: 6,
    title: "Israel x Hamas ceasefire by August 15?",
    percentage: 25,
    volume: "$2m Vol.",
    avatar: "/placeholder.svg?height=32&width=32",
    outcomes: [
      { name: "Yes", percentage: 25, color: "green" },
      { name: "No", percentage: 75, color: "red" },
    ],
  },
  {
    id: 7,
    title: "Who will be named in newly released Epstein files?",
    percentage: 36,
    volume: "$48k Vol.",
    avatar: "/placeholder.svg?height=32&width=32",
    outcomes: [
      { name: "Bill Clinton", percentage: 36 },
      { name: "Prince Andrew", percentage: 32 },
      { name: "Bill Gates", percentage: 28 },
    ],
  },
  {
    id: 8,
    title: "Will Polymarket US go live in 2025?",
    percentage: 69,
    volume: "$239k Vol.",
    avatar: "/placeholder.svg?height=32&width=32",
    outcomes: [
      { name: "Yes", percentage: 69, color: "green" },
      { name: "No", percentage: 31, color: "red" },
    ],
  },
]

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
  const categories = molyparketInfo?.keywordsSorted || [];
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
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

  const handleToggleFavorite = (e: React.MouseEvent, marketId: number) => {
    e.preventDefault()
    e.stopPropagation()
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
            filteredMarkets.map((market) => (
              <Link key={market.id} href={`/market/${market.id}`} className="block">
                <Card className="hover:border-primary transition-colors duration-200 h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-start space-x-3 mb-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={market.avatar || "/placeholder.svg"} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2">{market.title}</h3>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-bold text-foreground">{market.percentage}%</span>
                      <span className="text-xs text-muted-foreground">chance</span>
                    </div>

                    <div className="mt-auto">
                      {market.outcomes.length === 2 && market.outcomes[0].color ? (
                        <div className="space-y-2 mb-4">
                          <div className="flex space-x-2">
                            <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                              Buy Yes ↗
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10 bg-transparent"
                            >
                              Buy No ↘
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 mb-4">
                          {market.outcomes.slice(0, 3).map((outcome, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{outcome.name}</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-foreground">{outcome.percentage}%</span>
                                <span className="text-green-600">Yes</span>
                                <span className="text-red-600">No</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{market.volume}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleToggleFavorite(e, market.id)}
                            className="p-1 hover:text-primary"
                            aria-label="Toggle favorite"
                          >
                            <Bell
                              className={`w-3.5 h-3.5 transition-colors ${
                                favorites.has(market.id) ? "fill-current text-primary" : ""
                              }`}
                            />
                          </button>
                          <User className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
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
