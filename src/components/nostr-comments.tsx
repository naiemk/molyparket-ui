"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, ExternalLink, Twitter } from "lucide-react"
import { useEffect, useState } from "react"

// Declare Twitter widget types
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: () => void
      }
    }
  }
}

interface NostrCommentsProps {
  noteUrl: string
}

export function NostrComments({ noteUrl }: NostrCommentsProps) {
  
  // Detect current theme
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')
  
  // Load Twitter embed script when component mounts
  useEffect(() => {
    // Check if Twitter script is already loaded
    if (!window.twttr) {
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.charset = 'utf-8'
      document.head.appendChild(script)
      
      // When script loads, render any Twitter embeds
      script.onload = () => {
        if (window.twttr && window.twttr.widgets) {
          window.twttr.widgets.load()
        }
      }
    } else {
      // Script already exists, just render widgets
      window.twttr.widgets.load()
    }
  }, [])
  
  // Detect theme changes
  useEffect(() => {
    const detectTheme = () => {
      // Check if document has dark class or data-theme attribute
      if (document.documentElement.classList.contains('dark') || 
          document.documentElement.getAttribute('data-theme') === 'dark') {
        setCurrentTheme('dark')
      } else {
        setCurrentTheme('light')
      }
    }
    
    // Initial detection
    detectTheme()
    
    // Watch for theme changes
    const observer = new MutationObserver(detectTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    })
    
    return () => observer.disconnect()
  }, [])
  
  if (!noteUrl) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Discussion & Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No discussion URL provided for this market.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  // Check if it's a Twitter/X URL
  const isTwitter = noteUrl.includes('twitter.com') || noteUrl.includes('x.com')
  
  // Check if it's a Nostr URL/ID
  const isNostr = noteUrl.includes('nostr:') || 
                  noteUrl.startsWith('note1') || 
                  noteUrl.startsWith('nevent1') ||
                  noteUrl.split('/').pop()?.startsWith('note1') ||
                  noteUrl.split('/').pop()?.startsWith('nevent1')
  
  // Extract Twitter tweet ID
  const getTwitterId = (url: string) => {
    const match = url.match(/status\/(\d+)/)
    return match ? match[1] : null
  }
  
  // Extract Nostr event ID
  const getNostrId = (url: string) => {
    let noteId = url
    
    // Handle nostr: URLs (e.g., nostr:note1...)
    if (noteId.startsWith('nostr:')) {
      noteId = noteId.replace('nostr:', '')
    }
    
    // Handle full URLs, extract the event ID from the end
    if (noteId.includes('/') && !noteId.startsWith('note1') && !noteId.startsWith('nevent1')) {
      noteId = url.split('/').pop() || url
    }
    
    // Remove any query parameters or fragments
    noteId = noteId.split('?')[0].split('#')[0]
    
    // Ensure we have a valid Nostr event ID
    if (noteId.startsWith('nevent1') || noteId.startsWith('note1')) {
      return noteId
    }
    
    return null
  }
  
  // Handle Twitter/X embeds
  if (isTwitter) {
    const tweetId = getTwitterId(noteUrl)
    
    if (!tweetId) {
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Twitter className="w-5 h-5" />
              Twitter Discussion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Invalid Twitter URL format. Expected format: https://twitter.com/username/status/123456789
            </p>
            <a
              href={noteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Open Twitter URL
            </a>
          </CardContent>
        </Card>
      )
    }
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="w-5 h-5" />
            Twitter Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                This market has an associated Twitter discussion thread.
              </p>
              <p className="text-xs font-mono bg-background p-2 rounded border">
                Tweet ID: {tweetId}
              </p>
            </div>
            
            {/* Twitter Embed */}
            <div className="flex justify-center">
              <blockquote
                className="twitter-tweet"
                data-theme={currentTheme}
                data-dnt="true"
                data-lang="en"
              >
                <a href={`https://twitter.com/i/status/${tweetId}`}></a>
              </blockquote>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              If the tweet doesn&apos;t load, you can{' '}
              <a
                href={noteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                view it directly on Twitter
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Handle Nostr links
  if (isNostr) {
    const nostrId = getNostrId(noteUrl)
    
    if (!nostrId) {
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Nostr Discussion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Invalid Nostr event ID format. Expected format: nostr:note1... or nostr:nevent1...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Current value: {noteUrl}
            </p>
          </CardContent>
        </Card>
      )
    }
    
    // Various Nostr services where users can view the event
    const nostrServices = [
      { 
        name: 'Nostr.watch', 
        url: `https://nostr.watch/e/${nostrId}`,
        description: 'Fast and reliable Nostr client'
      },
      { 
        name: 'Snort', 
        url: `https://snort.social/e/${nostrId}`,
        description: 'Popular Nostr client with good UI'
      },
      { 
        name: 'Nostr.band', 
        url: `https://nostr.band/${nostrId}`,
        description: 'Nostr search and discovery platform'
      },
      { 
        name: 'Iris', 
        url: `https://iris.to/${nostrId}`,
        description: 'Clean and simple Nostr client'
      }
    ]
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Discussion & Comments (Nostr)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                This market has an associated Nostr discussion thread. Click any of the services below to view and participate in the discussion.
              </p>
              <p className="text-xs font-mono bg-background p-2 rounded border break-all">
                Event ID: {nostrId}
              </p>
            </div>
            
            <div className="grid gap-3">
              {nostrServices.map((service) => (
                <a
                  key={service.name}
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              These services will open in new tabs. You can view the discussion, add comments, and interact with other traders there.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Handle unknown URL types
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Discussion & Comments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This market has an associated discussion thread with an unsupported URL format.
          </p>
          <a
            href={noteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Open Discussion URL
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
