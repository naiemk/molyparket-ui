import { MarketDetailClient } from "./market-detail-client"

export default async function MarketDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <MarketDetailClient id={resolvedParams.id} />
}
