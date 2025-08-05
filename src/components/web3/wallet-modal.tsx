'use client'

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ExternalLink } from 'lucide-react'
import { AddressBox } from './address-box'
import { getChain, Utils } from 'web3-react-ui'
import Image from 'next/image'
import { DEFAULT_ICON } from '@/types/token'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  address: string
  chainId: string
  onDisconnect: () => void
}

export function WalletModal({
  isOpen,
  onClose,
  address,
  chainId,
  onDisconnect
}: WalletModalProps) {
  // const { theme } = useTheme()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="
        p-0 gap-0 
        bg-background text-foreground
        w-[95vw] min-w-[280px] max-w-[380px] 
        max-h-[90vh] h-auto rounded-xl
        fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2
      ">
        <div className="flex flex-col h-full max-h-full overflow-hidden">
          <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-border">
            <h2 className="text-xl font-bold">Your Wallet</h2>
          </div>

          <Tabs defaultValue="wallet" className="flex-grow flex flex-col min-h-0">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="wallet" className="py-2 data-[state=active]:bg-background">
                Wallet
              </TabsTrigger>
              {/* <TabsTrigger value="transactions" className="py-2 data-[state=active]:bg-background">
                Transactions
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="wallet" className="flex-grow overflow-y-auto p-4 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-primary">YOUR ADDRESS</h3>
                <AddressBox address={address} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image src={getChain(chainId)?.icon || DEFAULT_ICON} alt={getChain(chainId)?.label || '?'} width={24} height={24} />
                  <span className="text-sm">{getChain(chainId)?.label || '?'}</span>
                </div>
                <a
                  href={Utils.addressLink(chainId, address)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                >
                  Explorer
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">BNB Balance</span>
                  <span>{balance.bnb}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CAKE Balance</span>
                  <span>{balance.cake}</span>
                </div>
              </div> */}

              <Button
                onClick={onDisconnect}
                variant="outline"
                className="w-full"
              >
                Disconnect Wallet
              </Button>
            </TabsContent>

            <TabsContent value="transactions" className="flex-grow overflow-y-auto p-4">
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Transaction history will appear here
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

