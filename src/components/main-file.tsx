"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"

import { Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { useMolyparket } from "@/hooks/use-molyparket"
import PoolCard from "./pool-card"
import { useConnectWalletSimple } from "web3-react-ui"
import { Pool } from "@/types/pool"

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
  
  // Memoize markets to prevent unnecessary re-renders
  const markets = useMemo(() => molyparketInfo?.pools || [], [molyparketInfo?.pools]);
  
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") {
      return new Set()
    }
    const savedFavorites = localStorage.getItem("favoriteMarkets")
    return savedFavorites ? new Set(JSON.parse(savedFavorites)) : new Set()
  })

  // Add search and tag filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

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

  // Handle tag selection/deselection
  const handleTagClick = (tag: string) => {
    const newSelectedTags = new Set(selectedTags)
    if (newSelectedTags.has(tag)) {
      newSelectedTags.delete(tag)
    } else {
      newSelectedTags.add(tag)
    }
    setSelectedTags(newSelectedTags)
  }

  // Clear all selected tags
  const clearSelectedTags = () => {
    setSelectedTags(new Set())
  }

  // Filter markets based on search query, selected tags, and favorites
  const filteredMarkets = useMemo(() => {
    let filtered = markets

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((market: Pool) => {
        return (
          market.title.toLowerCase().includes(query) ||
          market.creator.toLowerCase().includes(query) ||
          market.resolutionPrompt.toLowerCase().includes(query)
        )
      })
    }

    // Apply tag filter
    if (selectedTags.size > 0) {
      filtered = filtered.filter((market: Pool) => {
        const marketTags = market.tags.split(',').map(tag => tag.trim().toLowerCase())
        return Array.from(selectedTags).some(selectedTag => 
          marketTags.includes(selectedTag.toLowerCase())
        )
      })
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((market) => favorites.has(market.id))
    }

    return filtered
  }, [markets, searchQuery, selectedTags, showFavoritesOnly, favorites])

  return (
    <div className="min-h-screen bg-background">
    <Header onBellClick={() => setShowFavoritesOnly(!showFavoritesOnly)} isFavoritesActive={showFavoritesOnly} />
    {/* Search and Filters */}
      <div className="border-b border-border px-4 py-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search pools by title, creator, or description..." 
                className="pl-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Menu className="w-4 h-4" />
            </Button>
          </div>

          {/* Selected Tags Display */}
          {selectedTags.size > 0 && (
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {Array.from(selectedTags).map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="whitespace-nowrap cursor-pointer flex items-center gap-1"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelectedTags}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedTags.has(category) ? "default" : "secondary"}
                className={`whitespace-nowrap cursor-pointer transition-colors ${
                  selectedTags.has(category) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted-foreground/20'
                }`}
                onClick={() => handleTagClick(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Markets Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Results Count */}
        {(searchQuery || selectedTags.size > 0) && (
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredMarkets.length === 0 ? (
              <span>No results found</span>
            ) : (
              <span>
                Showing {filteredMarkets.length} of {markets.length} pools
                {searchQuery && ` matching "${searchQuery}"`}
                {selectedTags.size > 0 && ` with selected tags`}
              </span>
            )}
          </div>
        )}

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
              {showFavoritesOnly ? (
                <>
                  <p>No favorite markets found.</p>
                  <p className="text-sm">Click the bell icon on a market card to add it to your favorites.</p>
                </>
              ) : searchQuery || selectedTags.size > 0 ? (
                <>
                  <p>No markets match your current filters.</p>
                  <p className="text-sm">Try adjusting your search terms or selected tags.</p>
                </>
              ) : (
                <>
                  <p>No markets available.</p>
                  <p className="text-sm">Please check back later.</p>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
