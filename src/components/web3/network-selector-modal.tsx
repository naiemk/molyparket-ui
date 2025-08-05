'use client'

import { DEFAULT_ICON } from '@/types/token'
import { ListSelectorModal } from './list-selector-modal'
import { getChain } from 'web3-react-ui'
import Image from 'next/image'

interface NetworkSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (id: string) => void
  networkIds: string[]
}

export function NetworkSelectorModal({
  isOpen,
  onClose,
  onSelect,
  networkIds
}: NetworkSelectorModalProps) {
  const titleBar = (
    <>
      <div className="flex items-center gap-3">
        <span className="text-xl font-semibold">Select Network</span>
      </div>
    </>
  )

  const itemRenderer = (networkId: string) => (
    <>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted dark:bg-muted">
          <Image
            src={getChain(networkId)?.icon || DEFAULT_ICON}
            alt={getChain(networkId)?.label || ''}
            width={32}
            height={32}
          />
        </div>
        <div className="text-left">
          <div className="font-medium dark:text-foreground">{getChain(networkId)?.label}</div>
          <div className="text-sm text-muted-foreground dark:text-muted-foreground">{getChain(networkId)?.token}</div>
        </div>
      </div>
    </>
  )

  return (
    <ListSelectorModal
      title="Select Network"
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelect}
      items={networkIds}
      itemRenderer={itemRenderer}
      displayCommonItems={false}
      titleBar={titleBar}
      searchPlaceholder="Search by name, token, or chain ID"
    />
  )
}

