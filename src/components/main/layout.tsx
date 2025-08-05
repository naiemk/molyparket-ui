import { ThemeProvider } from './theme-provider'
import { Navbar } from './navbar'
import { Toaster } from "@/components/ui/toaster"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
        <Navbar />
        <main className="pt-16">
          {children}
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

