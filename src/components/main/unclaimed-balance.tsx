import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { getChain, useConnectWalletSimple, useContracts } from "web3-react-ui";
import { useEffect, useState } from "react";
import { UnclaimedBalanceModal } from "./unclaimed-balance-modal";
import { TransactionReceipt } from "ethers";

export function UnclaimedBalance({contractAddress, onTransactionSubmitted}: {contractAddress: string,
  onTransactionSubmitted: (tx: TransactionReceipt) => void}) {
  const { address, chainId} = useConnectWalletSimple();
  const [pending, setPending] = useState(false)
  const [isUnclaimedBalanceModalOpen, setIsUnclaimedBalanceModalOpen] = useState(false)
  const [unclaimedBalance, setUnclaimedBalance] = useState<{amount: string, tokenAddress: string | null}>({
    amount: '',
    tokenAddress: null
  })
  const { callMethod, execute } = useContracts();
  console.log('unclaimedBalance', unclaimedBalance)
  useEffect(() => {
    const getUnclaimedBalance = async () => {
      if (address && chainId) {
        setPending(true)
        try {
        const balanceLen = await callMethod(chainId, contractAddress,
          'function pendingSwapsLength(address user) view returns (uint256)', [address])
        if (!balanceLen || balanceLen == BigInt(0)) {
          setUnclaimedBalance({
            amount: '0',
            tokenAddress: null
          })
          return;
        }
        const topBalance = await callMethod(chainId, contractAddress,
          'function pendingSwaps(address user, uint256 index) view returns (address token, uint256 amount, address recipient)',
          [address, balanceLen - BigInt(1)])
        if (topBalance) {
          const balance = {
            tokenAddress: topBalance[0].toString(),
            amount: topBalance[1].toString(),
          }
          setUnclaimedBalance(balance)
        }
        } catch (e) {
          console.error('Error getting unclaimed balance', e)
        } finally {
          setPending(false)
        }
      }
    }
    getUnclaimedBalance()
  }, [address, chainId, contractAddress, callMethod])

  const handleClaim = async () => {
    console.log('Claiming balance')
    try {
      setPending(true)
      setIsUnclaimedBalanceModalOpen(false)
      const tx = await execute(contractAddress, 'function withdrawAllPendingSwaps(address user)', [address], {gasLimit: 1000000, wait: true});
      console.log('Claim transaction:', tx);
      onTransactionSubmitted(tx)
    } finally {
      setPending(false)
    }
  }

  if (!unclaimedBalance.amount || unclaimedBalance.amount === '0') {
    return <></>
  }

  console.log('rendering unclaimedBalance', unclaimedBalance)
  return (
    <>
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You have some unclaimed balance on the {getChain(chainId || '1')?.label}.{' '}
          <button
            onClick={() => setIsUnclaimedBalanceModalOpen(true)}
            className="font-medium underline underline-offset-4"
            disabled={pending}
          >
            See more
          </button>
        </AlertDescription>
      </Alert>
      <UnclaimedBalanceModal
        isOpen={isUnclaimedBalanceModalOpen}
        onClose={() => setIsUnclaimedBalanceModalOpen(false)}
        chainId={chainId!}
        unclaimedBalance={unclaimedBalance}
        onClaim={() => {
          handleClaim()
        }}
      />
    </>
  )
}