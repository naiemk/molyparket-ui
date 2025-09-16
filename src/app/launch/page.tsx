"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle, ExternalLink, Bot, Loader2 } from 'lucide-react'
import { DatePicker } from "@/components/ui/date-picker"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ApprovableButton, useConnectWalletSimple, useContracts, useErc20 } from "web3-react-ui"
import { GLOBAL_CONFIG } from "@/types/token"
import { AppConfig } from "@/types/pool"
import { useMolyparket } from "@/hooks/use-molyparket"
import { TransactionModal } from "@/components/web3/transaction-modal"

const MAX_TITLE_LENGTH = 120
const MAX_PROMPT_LENGTH = 2048
const MIN_COLLATERAL = 0.5

export default function LaunchBetPage() {
  const { error, execute } = useContracts()
  const { address, chainId } = useConnectWalletSimple()
  const { molyparketInfo } = useMolyparket()
  const { toHumanReadable, toMachineReadable, getBalance } = useErc20(molyparketInfo?.collateralTokenAddress || "", chainId!)
  const appConfig = GLOBAL_CONFIG['APP'] as AppConfig || {}
  const [userBalance, setUserBalance] = useState("0")
  const contractAddress = (appConfig.betMarketContracts || [])[chainId || 'N/A'] || ''
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    logoUrl: "",
    closingTime: undefined as Date | undefined,
    resolutionTime: undefined as Date | undefined,
    collateral: "",
    resolutionPrompt: "",
    discussionUrl: "",
    tags: "",
  })
  const [logoError, setLogoError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleDateTimeChange = (
    field: 'closingTime' | 'resolutionTime',
    date: Date | undefined,
    time?: string
  ) => {
    if (!date) {
      setFormData(prev => ({ ...prev, [field]: undefined }));
      return;
    }

    const [hours, minutes] = time ? time.split(':').map(Number) : [date.getHours(), date.getMinutes()];
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);

    setFormData(prev => {
      const newValues = { ...prev, [field]: newDate };
      // Auto-adjust resolution time if it's before closing time
      if (field === 'closingTime' && newValues.resolutionTime && newValues.resolutionTime < newDate) {
        newValues.resolutionTime = newDate;
      }
      if (field === 'resolutionTime' && newValues.closingTime && newDate < newValues.closingTime) {
        newValues.resolutionTime = newValues.closingTime;
      }
      return newValues;
    });
  };

  const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setFormData((prev) => ({ ...prev, logoUrl: url }))
    setLogoError("")

    if (url) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        setLogoError("") // Clear any previous errors
        const ratio = Math.min(img.width, img.height) / Math.max(img.width, img.height)
        if (
          img.width < 100 ||
          img.width > 800 ||
          img.height < 100 ||
          img.height > 800 ||
          ratio < 0.7
        ) {
          setLogoError(
            `Logo must be 100-800px and nearly square (ratio > 0.7). Your image is ${img.width}x${img.height}.`
          )
        }
      }
      img.onerror = () => {
        // Don't show error for potential CORS issues - let the Avatar component handle it
        // If the image loads in the Avatar preview, it's likely valid
        setLogoError("")
      }
      img.src = url
    }
  }

  useEffect(() => {
    if (!address || !chainId || !molyparketInfo?.collateralTokenAddress) return;
    const loadBalance = async () => {
      const balance = await getBalance(address!)
      setUserBalance(toHumanReadable(balance) || '0')
    }
    loadBalance()
  }, [getBalance, address, chainId, molyparketInfo?.collateralTokenAddress, toHumanReadable])

  const generateLogoPrompt = () => {
    const prompt = `Create a logo, 400x400, for a prediction market with the title: "${formData.title}"`
    const url = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`
    window.open(url, '_blank')
  }

  const onTransactionSubmitted = (tx: string) => {
    if (!tx) { return }
    console.log('transaction submitted:', tx);
    setTransactionId(tx)
    setIsTransactionModalOpen(true)
  }

  const handleCreateMarket = async () => {
    if (!address || !chainId || !contractAddress) return;
    if (!molyparketInfo?.collateralTokenAddress) {
      console.error('No collateral token address found');
      return;
    }
    if (!userBalance) {
      console.error('No balance found');
      return;
    }
    /*
        function createBet(
        string memory _title,
        string memory _resolutionPrompt,
        uint256 _initialLiquidity,
        uint256 _closingTime,
        uint256 _resolutionTime,
        string memory _discussionUrl,
        string memory _tags,
        string memory _logoUrl) external {
    */
   const closingTime = formData.closingTime ? formData.closingTime.getTime() / 1000 : 0
   const resolutionTime = formData.resolutionTime ? formData.resolutionTime.getTime() / 1000 : 0
   const machineAmount = toMachineReadable(formData.collateral)
   console.log('machineAmount', { machineAmount, closingTime, resolutionTime })
   console.log('About to create BET!', formData)
   setPending(true)
   try {
    const tx = await execute(
      contractAddress, 'function createBet(string memory _title, string memory _resolutionPrompt, uint256 _initialLiquidity, uint256 _closingTime, uint256 _resolutionTime, string memory _discussionUrl, string memory _tags, string memory _logoUrl)',
      [
        formData.title,
        formData.resolutionPrompt,
        machineAmount,
        closingTime,
        resolutionTime,
        formData.discussionUrl,
        formData.tags,
        formData.logoUrl], {wait: true});
      console.log('create market transaction:', tx);
      onTransactionSubmitted(tx?.hash)
    } catch (error) {
      console.error('Error execing creating market:', error);
    } finally {
      setPending(false);
    }
  }

  const titleCharCount = formData.title.length
  const promptCharCount = formData.resolutionPrompt.length

  return (
    <div className="min-h-screen bg-background">
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        transactionId={transactionId || ''}
        chainId={chainId || ''}
      />
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Launch a New Market</h1>
        <form className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Market Details</CardTitle>
              <CardDescription>Define the core details of your prediction market.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength={MAX_TITLE_LENGTH}
                  placeholder="e.g., Will the Fed cut rates in 2025?"
                />
                <p className={`text-sm ${titleCharCount > MAX_TITLE_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                  {titleCharCount} / {MAX_TITLE_LENGTH}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateLogoPrompt}
                    disabled={!formData.title}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>
                <div className="flex items-center space-x-4">
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleLogoUrlChange}
                    placeholder="https://example.com/logo.png"
                  />
                  <Avatar>
                    <AvatarImage src={formData.logoUrl || "/placeholder.svg"} alt="Logo preview" />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                </div>
                {logoError && <p className="text-sm text-destructive">{logoError}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline & Liquidity</CardTitle>
              <CardDescription>Set the key dates and initial funding for the market.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="space-y-2">
                <Label htmlFor="closingTime">Closing Time</Label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <DatePicker
                      date={formData.closingTime}
                      setDate={(date) => handleDateTimeChange('closingTime', date, (document.getElementById('closingTime-time') as HTMLInputElement)?.value)}
                      placeholder="Select date"
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </div>
                  <Input
                    id="closingTime-time"
                    type="time"
                    className="w-32"
                    defaultValue={formData.closingTime ? `${String(formData.closingTime.getHours()).padStart(2, '0')}:${String(formData.closingTime.getMinutes()).padStart(2, '0')}` : '23:59'}
                    onChange={(e) => handleDateTimeChange('closingTime', formData.closingTime, e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolutionTime">Resolution Time</Label>
                 <div className="flex space-x-2">
                  <div className="flex-1">
                    <DatePicker
                      date={formData.resolutionTime}
                      setDate={(date) => handleDateTimeChange('resolutionTime', date, (document.getElementById('resolutionTime-time') as HTMLInputElement)?.value)}
                      placeholder="Select date"
                      disabled={(date) => {
                        if (formData.closingTime) {
                          // Compare only the date part (ignoring time)
                          const closingDate = new Date(formData.closingTime.getFullYear(), formData.closingTime.getMonth(), formData.closingTime.getDate());
                          const resolutionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                          return resolutionDate < closingDate;
                        }
                        // If no closing time, disable dates before today
                        const today = new Date();
                        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const resolutionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        return resolutionDate < todayDate;
                      }}
                    />
                  </div>
                  <Input
                    id="resolutionTime-time"
                    type="time"
                    className="w-32"
                    defaultValue={formData.resolutionTime ? `${String(formData.resolutionTime.getHours()).padStart(2, '0')}:${String(formData.resolutionTime.getMinutes()).padStart(2, '0')}` : '23:59'}
                    onChange={(e) => handleDateTimeChange('resolutionTime', formData.resolutionTime, e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="collateral">Initial Liquidity (USDT)</Label>
                  <p className="text-sm text-muted-foreground">Your Balance: ${parseFloat(userBalance).toFixed(2)}</p>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="collateral"
                    type="number"
                    value={formData.collateral}
                    onChange={handleInputChange}
                    placeholder="20.00"
                    className="pl-7"
                    min={MIN_COLLATERAL}
                  />
                </div>
                {formData.collateral && parseFloat(formData.collateral) < MIN_COLLATERAL && (
                  <p className="text-sm text-destructive">Minimum initial liquidity is ${MIN_COLLATERAL}.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resolution Criteria</CardTitle>
              <CardDescription>Provide clear and objective information for resolving the market.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="resolutionPrompt">Resolution Prompt</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Clearly define the question and the criteria for a &quot;Yes&quot; or &quot;No&quot; outcome. The prompt should
                          be unambiguous and rely on publicly verifiable information.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="resolutionPrompt"
                  value={formData.resolutionPrompt}
                  onChange={handleInputChange}
                  rows={6}
                  maxLength={MAX_PROMPT_LENGTH}
                  placeholder="Describe the event and how it will be resolved..."
                />
                <p className={`text-sm ${promptCharCount > MAX_PROMPT_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                  {promptCharCount} / {MAX_PROMPT_LENGTH}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="discussionUrl">Social Media Post URL (Optional)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Share a link to your X (Twitter) post or Nostr note about this bet. This allows others to discover, 
                          share, and discuss your prediction market, increasing engagement and liquidity.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create and share a post about this bet on X (Twitter) or Nostr to help others discover and discuss it.
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    id="discussionUrl"
                    value={formData.discussionUrl}
                    onChange={handleInputChange}
                    placeholder="https://x.com/username/status/... or nostr:note1..."
                  />
                  <div className="flex space-x-2">
                    <Button variant="outline" asChild>
                      <a href="https://x.com/compose/tweet" target="_blank" rel="noopener noreferrer">
                        Create X Post
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="https://nostrudel.ninja/" target="_blank" rel="noopener noreferrer">
                        Create Nostr Note
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., politics, fed, rates, 2025"
                />
                <p className="text-sm text-muted-foreground">Comma-separated list of tags.</p>
              </div>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error.substring(0, 200)}</p>}
          <div className="flex justify-end">
            <ApprovableButton
              chainId={chainId!}
              token={molyparketInfo?.collateralTokenAddress || ''}
              amount={formData.collateral}
              spender={contractAddress!}
              approveButton={(onApprove, pending) => (<Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={onApprove}
                      disabled={pending}
                    >
                      Approve {pending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : ''}
                    </Button>)}
              actionButton={
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleCreateMarket}
                      disabled={pending ||
                        !formData.title || !formData.resolutionPrompt || !formData.closingTime ||
                        !formData.resolutionTime || !formData.collateral || !formData.logoUrl
                      }
                    >
                      Launch Market {pending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : ''}
                    </Button>}
              unknownState={ <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={true}
                    >
                      Launch Market
                    </Button>}
            />
          </div>
        </form>
      </main>
    </div>
  )
}
