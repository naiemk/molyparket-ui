'use client'

import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, Plus } from 'lucide-react'
import { copyToClipboard } from '@/utils/web3'
import { useToast } from "@/hooks/use-toast"
import { ListSelectorModal } from './list-selector-modal'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Token, Utils } from "web3-react-ui"
import Image from 'next/image'
import { DEFAULT_ICON } from "@/types/token"
import emptyCircle from './empty-circle.svg'

export interface TokenSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (token: Token) => void
  selectedToken: Token | null
  tokens: Token[]
}

export function TokenSelectorModal({
  isOpen,
  onClose,
  onSelect,
  selectedToken,
  tokens
}: TokenSelectorModalProps) {
  const { toast } = useToast()

  const handleCopyAddress = async (address: string) => {
    const success = await copyToClipboard(address)
    if (success) {
      toast({
        title: "Address Copied",
        description: "The token address has been copied to your clipboard.",
        duration: 3000,
      })
    }
  }

  const handleAddToMetamask = async (token: Token) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).ethereum || !token.address) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window as any).ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
            image: token.logoURI,
          },
        },
      })

      toast({
        title: "Token Added",
        description: `${token.symbol} has been added to MetaMask.`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Error adding token to MetaMask:', error)
    }
  }

  const openExplorer = (token: Token) => {
    const url = Utils.addressLink(token.chainId, token.address);
    if (url) window.open(url)
  }

  const titleBar = (
    <>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-yellow-400">
          <Image
            src={selectedToken?.logoURI || emptyCircle.src}
            alt={selectedToken?.name || ''}
            width={32}
            height={32}
          />
        </div>
        <span className="text-lg font-semibold">{selectedToken?.symbol || ''}</span>
        {selectedToken?.address && (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopyAddress(selectedToken.address!)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy Address</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => openExplorer(selectedToken)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View on Explorer</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleAddToMetamask(selectedToken)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to MetaMask</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </>
  )

  const itemRenderer = (token: Token) => (
    <>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-yellow-400">
          <Image
            src={token?.logoURI || DEFAULT_ICON}
            alt={token?.symbol || ''}
            width={32}
            height={32}
          />
        </div>
        <div className="text-left">
          <div className="font-medium">{token.symbol}</div>
          <div className="text-sm text-muted-foreground">{token.name}</div>
        </div>
      </div>
      <div className="text-right text-sm text-muted-foreground">
        {'0'}
      </div>
    </>
  )

  const commonItems = tokens.slice(0, 3).map(token => ({
    item: token,
    name: token.symbol,
    logo: token.logoURI
  }))

  return (
    <ListSelectorModal
      title="Select Token"
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelect}
      items={tokens}
      itemRenderer={itemRenderer}
      commonItems={commonItems}
      displayCommonItems={true}
      titleBar={titleBar}
      searchPlaceholder="Search by name or paste address"
    />
  )
}

