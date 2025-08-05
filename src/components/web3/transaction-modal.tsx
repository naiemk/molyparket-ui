'use client'

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { ExternalLink } from 'lucide-react'
import { AddressBox } from './address-box'
import { getChain, Utils } from 'web3-react-ui'
import Image from 'next/image'
import { DEFAULT_ICON } from '@/types/token'
import { Button } from "../ui/button"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: string
  chainId: string
}

export function TransactionModal({
  isOpen,
  onClose,
  transactionId,
  chainId,
}: TransactionModalProps) {
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
            <h2 className="text-xl font-bold">Following transaction was submitted</h2>
          </div>

          <Tabs defaultValue="wallet" className="flex-grow flex flex-col min-h-0">
            <TabsContent value="wallet" className="flex-grow overflow-y-auto p-4 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-primary">TRANSACTION HASH</h3>
                <AddressBox address={transactionId} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image src={getChain(chainId)?.icon || DEFAULT_ICON} alt={getChain(chainId)?.label || '?'} width={24} height={24} />
                  <span className="text-sm">{getChain(chainId)?.label || '?'}</span>
                </div>
                <a
                  href={Utils.transactionLink(chainId, transactionId)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                >
                  Explorer
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}


