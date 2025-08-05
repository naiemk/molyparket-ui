import { Button } from "@/components/ui/button"
import { Copy } from 'lucide-react'
import { copyToClipboard } from "@/utils/web3"
import { useToast } from "@/hooks/use-toast"

interface AddressBoxProps {
  address: string
}

export function AddressBox({ address }: AddressBoxProps) {
  const { toast } = useToast()

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(address)
    if (success) {
      toast({
        title: "Address Copied",
        description: "The wallet address has been copied to your clipboard.",
        duration: 3000,
      })
    } else {
      toast({
        title: "Copy Failed",
        description: "Failed to copy the address. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  return (
    <div className="flex items-center p-2 rounded-lg bg-muted">
      <div className="flex-grow min-w-0">
        <span className="text-sm font-mono truncate block">
          {address}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyAddress}
        className="ml-2 flex-shrink-0 h-8 w-8 text-primary"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )
}

