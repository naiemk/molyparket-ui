'use client'

import { useState } from 'react'
import { useConnectWallet } from '@web3-onboard/react'
import { Button } from "@/components/ui/button"
import { WalletModal } from './wallet-modal'
import { shortenAddress } from '@/utils/web3'

function Web3Connect() {
  return <ConnectWalletButton />
}

function ConnectWalletButton() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleConnect = async () => {
    if (wallet) {
      setIsModalOpen(true)
    } else {
      await connect()
    }
  }

  const handleDisconnect = async () => {
    setIsModalOpen(false)
    if (wallet) {
      await disconnect(wallet)
    }
  }

  return (
    <>
      <Button
        onClick={handleConnect}
        disabled={connecting}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {connecting ? (
          'Connecting...'
        ) : wallet ? (
          shortenAddress(wallet?.accounts?.[0]?.address || '')
        ) : (
          'Connect'
        )}
      </Button>

      {wallet && (
        <WalletModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          address={wallet.accounts?.[0]?.address}
          chainId={parseInt(wallet.chains?.[0]?.id || '0', 16).toString()}
          onDisconnect={handleDisconnect}
        />
      )}
    </>
  )
}

export default Web3Connect

