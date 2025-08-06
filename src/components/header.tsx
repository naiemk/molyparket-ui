"use client"

import { Moon, Sun, Bell } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import Image from 'next/image'
import logoDark from '@/img/molyparket-logo-2.png'
import logoWhite from '@/img/molyparket-logo-2-white.png'
import Web3Connect from '@/components/web3/web3-connect'

export function Header({
  onBellClick,
  isFavoritesActive,
}: {
  onBellClick?: () => void
  isFavoritesActive?: boolean
}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="border-b border-border px-4 md:px-6 py-4 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-3">
            <Image src={theme === 'dark' ? logoWhite.src : logoDark.src} alt="Molyparket" width={120} height={120} />         
          </Link>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {}}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Launch a Bet"
          >
            <Link href="/launch">Launch a Bet</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBellClick}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Toggle favorites"
          >
            <Bell className={`h-5 w-5 ${isFavoritesActive ? "fill-current text-primary" : ""}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {mounted ? (
              <>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </>
            ) : (
              <div className="w-5 h-5" />
            )}
          </Button>

          <Web3Connect />   
        </div>
      </div>
    </header>
  )
}
