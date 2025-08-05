"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NostrCommentsProps {
  noteId: string
}

export function NostrComments({ noteId }: NostrCommentsProps) {
  // Using nostr.band for a clean, theme-aware embed
  const embedUrl = `https://nostr.band/embed/${noteId}`

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Live Comments (from Nostr)</CardTitle>
      </CardHeader>
      <CardContent>
        <iframe
          src={embedUrl}
          width="100%"
          height="600"
          frameBorder="0"
          scrolling="auto"
          className="rounded-md w-full"
          title="Nostr Comments"
          loading="lazy"
        />
      </CardContent>
    </Card>
  )
}
