'use client'

import { Button } from "@/components/ui/button"
import { DEFAULT_ICON } from "@/types/token"
import { ChevronDown } from 'lucide-react'
import { getChain } from 'web3-react-ui'
import Image from 'next/image'

interface NetworkSelectorProps {
  selectedNetworkId: string
  onOpenModal: () => void
  label?: string,
  disabled?: boolean
}

export function NetworkSelector({
  selectedNetworkId,
  onOpenModal,
  label,
  disabled
}: NetworkSelectorProps) {
  const selectedNetwork = getChain(selectedNetworkId)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <Button
        disabled={disabled}
        variant="outline"
        role="combobox"
        aria-expanded={false}
        aria-label="Select destination network"
        className="w-full justify-between bg-card border border-border hover:bg-accent hover:text-accent-foreground dark:bg-background dark:border-border dark:hover:bg-accent dark:text-foreground"
        onClick={() => onOpenModal()}
      >
        {selectedNetwork ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-muted">
            <Image
              src={selectedNetwork.icon || DEFAULT_ICON}
              alt={selectedNetwork.label || ''}
              width={24}
              height={24}
            />
          </div>
          <span className="font-medium">{selectedNetwork.label}</span>
        </div>
        ) : <div className="text-muted-foreground">Select Network</div>}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground dark:text-muted-foreground" />
      </Button>

    </div>
  )
}

