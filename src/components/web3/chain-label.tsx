import { DEFAULT_ICON } from "@/types/token"
import Image from "next/image"
import { getChain } from "web3-react-ui"

export function ChainLogo({chainId}: {chainId: string}) {
  return (
    <div className="w-6 h-6 rounded-full overflow-hidden bg-background">
      <Image
        src={getChain(chainId)?.icon || DEFAULT_ICON}
        alt={getChain(chainId)?.label || ''}
        width={24}
        height={24}
      />
    </div>
  )
}

export function ChainLabel({ chainId, label }: { chainId: string, label?: string}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <div className="flex items-center gap-2">
        <ChainLogo chainId={chainId} />
        <span className="font-medium text-sm text-foreground">{label || getChain(chainId)?.label}</span>
      </div>
    </div>
  )
}