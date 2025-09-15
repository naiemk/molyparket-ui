"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ApprovableButton, useConnectWalletSimple, useContracts, useErc20 } from "web3-react-ui"
import {  ZeroAddress } from "ethers"
import { Pool } from "@/types/pool"
import { useSearchParams } from "next/navigation"
import { MolyparketInfo } from "@/hooks/use-molyparket"
import { Loader2, Clock, CheckCircle, XCircle, MinusCircle } from "lucide-react"

interface TradeControlsProps {
  pool: Pool
  molyparketInfo: MolyparketInfo
  chainId: string
  contractAddress: string
  yesPrice: string
  noPrice: string
  balance: string
  yesBalance: string
  noBalance: string
  onTransactionSubmitted: (tx: { hash: string }) => void
}

export function TradeControls({
  pool,
  molyparketInfo,
  chainId,
  contractAddress,
  yesPrice,
  noPrice,
  balance,
  yesBalance,
  noBalance,
  onTransactionSubmitted
}: TradeControlsProps) {
  const { error, execute, callMethod } = useContracts();
  const { address } = useConnectWalletSimple();
  const [betType, setBetType] = useState<"Buy" | "Sell">("Buy")
  const [selectedOutcome, setSelectedOutcome] = useState<"Yes" | "No">("Yes")
  const [amount, setAmount] = useState("")
  const [pending, setPending] = useState(false)
  const [withdrawableAmount, setWithdrawableAmount] = useState<string>("")
  const [isLoadingWithdrawable, setIsLoadingWithdrawable] = useState(false)
  const { toMachineReadable, toHumanReadable } = useErc20(molyparketInfo?.collateralTokenAddress || "", chainId!);
  const searchParams = useSearchParams()
  const referrer = searchParams.get('r') || '';

  // Check if pool is closed (current time > closing time)
  const isPoolClosed = useCallback(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    const closingTime = parseInt(pool.closingTime || "0");
    return currentTime > closingTime;
  }, [pool.closingTime]);

  // Get resolution status
  const getResolutionStatus = () => {
    const resolution = pool.resolution || "0";
    switch (resolution) {
      case "1": // Resolution.YES
        return { status: "YES", icon: <CheckCircle className="w-4 h-4 text-green-500" />, color: "text-green-500" };
      case "2": // Resolution.NO
        return { status: "NO", icon: <XCircle className="w-4 h-4 text-red-500" />, color: "text-red-500" };
      case "3": // Resolution.INCONCLUSIVE
        return { status: "INCONCLUSIVE", icon: <MinusCircle className="w-4 h-4 text-yellow-500" />, color: "text-yellow-500" };
      default:
        return { status: "UNRESOLVED", icon: <Clock className="w-4 h-4 text-blue-500" />, color: "text-blue-500" };
    }
  };

  // Load withdrawable amount for resolved pools
  useEffect(() => {
    if (!isPoolClosed() || !address || !chainId || !contractAddress) return;
    
    const loadWithdrawableAmount = async () => {
      if (!address || !chainId || !contractAddress || !pool.id) return;
      setIsLoadingWithdrawable(true);
      try {
        const withdrawable = await callMethod(
          chainId, 
          contractAddress, 
          "function withdrawableAmount(uint256,address) view returns (uint256)", 
          [pool.id, address]
        );
        setWithdrawableAmount(toHumanReadable(withdrawable || "0") || "0");
      } catch (e) {
        console.error('Error loading withdrawable amount:', e);
        setWithdrawableAmount("0");
      } finally {
        setIsLoadingWithdrawable(false);
      }
    };

    loadWithdrawableAmount();
  }, [pool.id, address, chainId, contractAddress, callMethod, isPoolClosed, toHumanReadable]);

  const getSelectedOutcomeBalance = () => {
    return selectedOutcome === "Yes" ? yesBalance : noBalance;
  };

  const calculatePercentageAmount = (percentage: number) => {
    const balance = parseFloat(getSelectedOutcomeBalance());
    if (isNaN(balance)) return "0";
    return (balance * percentage / 100).toString();
  };

  const handleTrade = async () => {
    if (!address || !chainId || !contractAddress) return;
    setPending(true);
    try {
      const amountInWei = toMachineReadable(amount);
      if (betType === "Buy") {
        if (selectedOutcome === "Yes") {
          const tx = await execute(
            contractAddress, 'function buyYes(uint256 poolId, uint256 amount, address referrer)',
            [pool.id, amountInWei, referrer || ZeroAddress], {wait: true});
          console.log('buy yes transaction:', tx, amountInWei, referrer);
          if (tx) {
            onTransactionSubmitted(tx)
          }
        } else {
          const tx = await execute(
            contractAddress, 'function buyNo(uint256 poolId, uint256 amount, address referrer)',
            [pool.id, amountInWei, referrer || ZeroAddress], {wait: true});
          console.log('buy no transaction:', tx);
          if (tx) {
            onTransactionSubmitted(tx)
          }
        }
      } else {
        if (selectedOutcome === "Yes") {
          console.log('sell yes transaction:', amountInWei, pool.id, contractAddress);
          const tx = await execute(
            contractAddress, 'function sellYes(uint256 poolId, uint256 amount, address referrer)',
            [pool.id, amountInWei, referrer || ZeroAddress], {wait: true});
          console.log('sell yes transaction:', tx);
          onTransactionSubmitted(tx)
        } else {
          const tx = await execute(
            contractAddress, 'function sellNo(uint256 poolId, uint256 amount, address referrer)',
            [pool.id, amountInWei, referrer || ZeroAddress], {wait: true});
          console.log('sell no transaction:', tx);
          onTransactionSubmitted(tx)
        }
      }
    } finally {
      setPending(false);
    }
  };

  const handleResolve = async () => {
    if (!address || !chainId || !contractAddress) return;
    setPending(true);
    
    // Calculate ETH value needed for oracle gas (1M gas * estimated gas price)
    // Using a conservative estimate of 20 gwei for gas price
    const gwei = 5000n; // 20k gas for oracle callback as BigInt
    const ethValue = gwei * 10n ** 9n; // Keep as BigInt for value parameter
    
    // Call the smart contract to resolve the pool
    // The resolve function automatically determines the result
    // ETH value is sent to pay for oracle gas
    const tx = await execute(
      contractAddress, 
      'function resolve(uint256 poolId)', 
      [pool.id], 
      {
        wait: true,
        value: ethValue // ETH value to pay for oracle gas
      }
    );
    console.log('Resolve transaction:', tx);
    if (tx) {
      onTransactionSubmitted(tx);
    }
    setPending(false);
  };

  const handleWithdraw = async () => {
    if (!address || !chainId || !contractAddress) return;
    setPending(true);
    
    const tx = await execute(
      contractAddress, 
      'function withdraw(uint256 poolId)',
      [pool.id], 
      {
        wait: true,
      }
    );
    console.log('withdraw transaction:', tx);
    if (tx) {
      onTransactionSubmitted(tx);
      // Refresh the pool data after withdrawal
    }
    setPending(false);
  };

  const isClosed = isPoolClosed();
  const resolutionInfo = getResolutionStatus();
  const isResolved = pool.resolution !== "0"; // Assuming "0" means UNRESOLVED

  // If pool is closed, show different UI
  if (isClosed) {
    return (
      <Card className="sticky top-24">
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Pool Closed</h3>
            
            {/* Yes and No Balances */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-green-600 font-medium">Yes Balance</span>
                <span className="text-green-600 font-semibold">{yesBalance}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <span className="text-red-600 font-medium">No Balance</span>
                <span className="text-red-600 font-semibold">{noBalance}</span>
              </div>
            </div>

            {/* Result Status */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">Result:</span>
                {resolutionInfo.icon}
                <span className={`font-semibold ${resolutionInfo.color}`}>
                  {resolutionInfo.status}
                </span>
              </div>
            </div>

            {/* Withdrawable Amount */}
            <div className="mb-6">
              <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <span className="text-blue-600 font-medium">Withdrawable:</span>
                <span className="text-blue-600 font-semibold">
                  {isLoadingWithdrawable ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isResolved ? (
                    `$${withdrawableAmount}`
                  ) : (
                    "Pending"
                  )}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="space-y-3">
              {!isResolved ? (
                <>
                  <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="mb-1"><strong>Note:</strong> Resolving a pool requires ETH to pay for oracle gas.</p>
                    <p className="text-xs">Estimated cost: ~0.02 ETH (for 1M gas × 20 gwei)</p>
                  </div>
                  <Button 
                    className="w-full h-12 text-base bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={handleResolve}
                    disabled={pending}
                  >
                    {pending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Resolve
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleWithdraw}
                  disabled={pending || parseFloat(withdrawableAmount) <= 0}
                >
                  {pending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Withdraw
                </Button>
              )}
            </div>

            {error && <div className="text-red-500 mt-3 text-sm">{error.substring(0, 100)}</div>}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Original trading UI for open pools
  return (
    <Card className="sticky top-24">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 bg-secondary p-1 rounded-md">
            <Button
              variant={betType === "Buy" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBetType("Buy")}
              className={`w-16 ${
                betType === "Buy" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Buy
            </Button>
            <Button
              variant={betType === "Sell" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBetType("Sell")}
              className={`w-16 ${
                betType === "Sell" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Sell
            </Button>
          </div>
        </div>

        <div className="flex space-x-2 mb-4">
          <Button
            variant={selectedOutcome === "Yes" ? "default" : "outline"}
            className="flex-1 h-12 text-base bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20 data-[state=active]:bg-green-500 data-[state=active]:text-white"
            onClick={() => setSelectedOutcome("Yes")}
            data-state={selectedOutcome === "Yes" ? "active" : "inactive"}
          >
            Yes {yesPrice}
          </Button>
          <Button
            variant={selectedOutcome === "No" ? "default" : "outline"}
            className="flex-1 h-12 text-base bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 data-[state=active]:bg-red-500 data-[state=active]:text-white"
            onClick={() => setSelectedOutcome("No")}
            data-state={selectedOutcome === "No" ? "active" : "inactive"}
          >
            No {noPrice}
          </Button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            {betType === "Buy" 
              ? `Amount (Balance: USDT ${balance})`
              : `Amount (Balance: ${selectedOutcome} ${selectedOutcome === "Yes" ? yesBalance : noBalance})`
            }
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-2xl">
              {betType === "Buy" ? "$" : selectedOutcome === "Yes" ? "✓" : "✗"}
            </span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={betType === "Buy" ? "0" : `0 ${selectedOutcome}`}
              className="pl-8 text-2xl h-12"
            />
          </div>
          <div className="flex space-x-2 mt-2">
            {betType === "Buy" ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setAmount("1")}>
                  +$1
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAmount("20")}>
                  +$20
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAmount("100")}>
                  +$100
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAmount(balance)}>
                  Max
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setAmount(calculatePercentageAmount(25))}>
                  25%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAmount(calculatePercentageAmount(50))}>
                  50%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAmount(calculatePercentageAmount(75))}>
                  75%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAmount(getSelectedOutcomeBalance())}>
                  Max
                </Button>
              </>
            )}
          </div>
        </div>

        {betType === "Buy" ? (
          <ApprovableButton
            chainId={chainId}
            token={molyparketInfo?.collateralTokenAddress || ''}
            amount={betType === "Buy" ? amount : '0'}
            spender={contractAddress}
            approveButton={(onApprove, pending) => (
              <Button 
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white mb-4"
                onClick={onApprove}
                disabled={pending}
              >
                Approve USDT {pending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : ''}
              </Button>
            )}
            actionButton={
              <Button 
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white mb-4"
                onClick={handleTrade}
                disabled={!amount}
              >
                {betType === "Buy" ? `Buy ${selectedOutcome}` : `Sell ${selectedOutcome}`} {pending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : ''}
              </Button>
            }
            unknownState={
              <Button 
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white mb-4"
                disabled={true}
              >
                {betType === "Buy" ? `Buy ${selectedOutcome}` : `Sell ${selectedOutcome}`}
              </Button>
            }
          />
        ) : (
          <Button 
            className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white mb-4"
            disabled={!amount || pending}
            onClick={handleTrade}
          >
            Sell {selectedOutcome} {pending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : ''}
          </Button>
        )}

        {error && <div className="text-red-500">{error.substring(0, 100)}</div>}
        <p className="text-xs text-muted-foreground text-center">
          By trading, you agree to the <span className="text-blue-600 underline">Terms of Use</span>
        </p>
      </CardContent>
    </Card>
  )
}
