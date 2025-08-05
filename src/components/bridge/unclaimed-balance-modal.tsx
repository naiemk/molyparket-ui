'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X } from 'lucide-react'
import { useEffect, useState } from "react"
import { getChain, useErc20 } from 'web3-react-ui'

interface UnclaimedBalanceModalProps {
  isOpen: boolean
  onClose: () => void
  chainId: string
  unclaimedBalance: {
    amount: string | null
    tokenAddress: string | null
  }
  onClaim: () => void
}

export function UnclaimedBalanceModal({
  isOpen,
  onClose,
  chainId,
  unclaimedBalance,
  onClaim
}: UnclaimedBalanceModalProps) {
  const { tokenData, toHumanReadable } = useErc20(unclaimedBalance.tokenAddress || '', chainId)
  const [amount, setAmount] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (tokenData) {
      const amount = toHumanReadable(unclaimedBalance.amount || '0');
      const token = tokenData.symbol;
      setAmount(amount);
      setToken(token);
    }
  }, [tokenData, unclaimedBalance.amount, toHumanReadable])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4 text-foreground" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader>
          <DialogTitle className="text-foreground">Unclaimed balance</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            You have unclaimed balance on the {getChain(chainId)?.label}:
          </p>
          <p className="text-2xl font-bold mb-6 text-foreground">
            {amount} {token}
          </p>
          <Button onClick={onClaim} className="w-full" disabled={!amount || !token}>
            Claim
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

