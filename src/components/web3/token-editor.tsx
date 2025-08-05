'use client'

import { ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Token } from 'web3-react-ui'
import Image from 'next/image'
import emptyCircle from './empty-circle.svg'

export interface TokenEditorProps {
  value: string
  onChange: (value: string) => void
  onTokenSelect: () => void
  selectedToken: Token | null
  disabled?: boolean
}

export function TokenEditor({
  value,
  onChange,
  onTokenSelect,
  selectedToken,
  disabled = false
}: TokenEditorProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onChange(value)
    }
  }

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg bg-card border border-border",
      disabled && "opacity-50 pointer-events-none"
    )}>
      <Button
        type="button"
        variant="ghost"
        onClick={onTokenSelect}
        className="flex items-center gap-2 px-2 py-1 h-auto font-normal hover:bg-accent dark:hover:bg-accent dark:text-foreground"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-yellow-400 flex-shrink-0">
          <Image
            src={selectedToken?.logoURI || emptyCircle.src}
            alt={selectedToken?.name || ''}
            width={32}
            height={32}
          />
        </div>
        <span className="text-lg text-foreground">{selectedToken?.symbol || 'Select Token'}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      <Input
        type="text"
        value={value}
        onChange={handleInputChange}
        className="bg-transparent border-none text-right text-2xl text-foreground placeholder:text-muted-foreground focus-visible:ring-0 dark:text-foreground dark:placeholder:text-muted-foreground"
        placeholder="0.00"
        disabled={disabled}
      />
    </div>
  )
}

