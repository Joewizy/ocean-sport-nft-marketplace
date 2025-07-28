"use client"

import { useState, useEffect } from "react"
import { useAccount, useConfig, useBalance, useWriteContract } from "wagmi"
import { motion, AnimatePresence } from "framer-motion"
import { X, DollarSign, Coins, Zap, ExternalLink } from "lucide-react"
import { waitForTransactionReceipt } from "@wagmi/core"
import { nftMarketplaceAbi, nftMarketplaceAddress, usdtAddress } from "@/contracts/constants"
import { useRouter } from "next/navigation"
import toast from 'react-hot-toast'
import { formatPriceFromWei } from "@/utils/formatPrice"
import { useUSDTApproval } from "@/hooks/useNFT"
import { useNFTOperations } from "@/hooks/useGasSponsorship"

interface PlaceBidModalProps {
  isOpen: boolean
  onClose: () => void
  auction?: {
    id: number
    title: string
    image: string
    currentBid: bigint
    startingPrice: bigint
    isUSDT: boolean
    tokenId: string
  }
  nft?: { 
    id: string
    title: string
    image: string
    price: bigint
    isUSDT: boolean
    listingId: number
  }
  type: 'bid' | 'buy'
}

export function PlaceBidModal({ isOpen, onClose, auction, nft, type }: PlaceBidModalProps) {
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [useSponsorship, setUseSponsorship] = useState(false)
  
  const config = useConfig()
  const account = useAccount()
  const { writeContractAsync } = useWriteContract()
  const router = useRouter()
  
  const item = type === 'bid' ? auction : nft
  const currencyType = type === 'bid' ? auction?.isUSDT : nft?.isUSDT
  
  // Fetch user balances
  const ethBalance = useBalance({ address: account.address })
  const usdtBalance = useBalance({ address: account.address, token: usdtAddress as `0x${string}` })
  
  // USDT approval hook
  const { 
    setApproval: setUSDTApproval, 
    checkApproval: checkUSDTApproval, 
    isLoading: usdtApprovalLoading, 
    approvalError: usdtApprovalError, 
    clearError: clearUSDTApprovalError 
  } = useUSDTApproval()

  const { sponsoredPlaceBid, isSponsoring, isEnabled } = useNFTOperations()
  
  const clearError = () => {
    setError('')
    clearUSDTApprovalError()
  }

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('')
      setError('')
      setIsProcessing(false)
      clearUSDTApprovalError()
    }
  }, [isOpen, clearUSDTApprovalError])
  
  const handleAction = async () => {
    if (!account.address) {
      setError("Please connect your wallet to place bids")
      toast.error(
        <div className="flex flex-col gap-2">
          <span>Please connect your wallet to place bids</span>
          <span className="text-sm opacity-80">Click the "Connect Wallet" button in the top right</span>
        </div>,
        { duration: 5000 }
      )
      return
    }

    setIsProcessing(true)
    clearError()

    try {
      let txHash: string

      if (type === 'buy' && nft) {
        // Buy NFT logic - use the NFT price directly
        const amountInWei = nft.price
        
        // Check USDT approval for USDT purchases
        if (nft.isUSDT) {
          const isApproved = await checkUSDTApproval(amountInWei)
          if (!isApproved) {
            const approvalSuccess = await setUSDTApproval(amountInWei)
            if (!approvalSuccess) {
              setError("Failed to approve USDT spending. Please try again.")
              setIsProcessing(false)
              return
            }
          }
        }
        
        txHash = await writeContractAsync({
          abi: nftMarketplaceAbi,
          address: nftMarketplaceAddress as `0x${string}`,
          functionName: "buyNFT",
          args: [BigInt(nft.listingId)],
          value: nft.isUSDT ? BigInt(0) : amountInWei,
        })
      } else if (type === 'bid' && auction) {
        // Validate amount for bid transactions
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
          setError("Please enter a valid amount")
          setIsProcessing(false)
          return
        }

        const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18))

        // Place bid logic
        if (auction.isUSDT) {
          // USDT bidding - check approval first
          const isApproved = await checkUSDTApproval(amountInWei)
          if (!isApproved) {
            const approvalSuccess = await setUSDTApproval(amountInWei)
            if (!approvalSuccess) {
              setError("Failed to approve USDT spending. Please try again.")
              setIsProcessing(false)
              return
            }
          }
          
          // USDT bid: bidAmount = amount, msg.value = 0 (no sponsorship for USDT)
          txHash = await writeContractAsync({
            abi: nftMarketplaceAbi,
            address: nftMarketplaceAddress as `0x${string}`,
            functionName: "placeBid",
            args: [BigInt(auction.id), amountInWei],
            value: BigInt(0),
          })
        } else {
          // ETH bidding: sponsorship or regular
          if (useSponsorship && isEnabled) {
            txHash = await sponsoredPlaceBid(
              nftMarketplaceAddress,
              auction.id.toString(),
              amountInWei.toString()
            )
          } else {
            txHash = await writeContractAsync({
              abi: nftMarketplaceAbi,
              address: nftMarketplaceAddress as `0x${string}`,
              functionName: "placeBid",
              args: [BigInt(auction.id), BigInt(0)],
              value: amountInWei,
            })
          }
        }
      } else {
        throw new Error('Invalid action')
      }
      
      // Wait for confirmation
      const receipt = await waitForTransactionReceipt(config, { hash: txHash as `0x${string}` })
      if (receipt) {
        console.log('Transaction Hash:', receipt.transactionHash)
        
        toast.success(
          <div className="flex flex-col gap-2">
            <span>Transaction confirmed!</span>
            <a
              href={`https://sepolia.basescan.org/tx/${receipt.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-sm flex items-center gap-1"
            >
              View transaction <ExternalLink size={12} />
            </a>
          </div>,
          { duration: 6000 }
        )
        
        // Close modal after 3 seconds to ensure toast is visible
        setTimeout(() => {
          onClose()
          if (type === 'buy') {
            setTimeout(() => router.push('/profile?tab=collected'), 1500)
          }
        }, 3000)
      }
    } catch (err: unknown) {
      console.error('Transaction failed:', err)
      const msg = `Failed to ${type === 'bid' ? 'place bid' : 'complete purchase'}`
      setError(msg)
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }
  
  if (!item) return null

  const isLoading = isProcessing || usdtApprovalLoading || isSponsoring
  const displayError = error || usdtApprovalError

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {type === 'bid' ? 'Place a Bid' : 'Buy NFT'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* NFT Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{item.title}</h3>
                  {type === 'bid' && auction && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current Bid: {formatPriceFromWei(auction.currentBid, auction.isUSDT)}
                    </p>
                  )}
                  {type === 'bid' && auction && auction.currentBid > BigInt(0) && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                      Minimum bid: {formatPriceFromWei(auction.currentBid * BigInt(105) / BigInt(100), auction.isUSDT)}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Balances */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Balance</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Coins size={16} /><span>ETH</span></div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
                      {ethBalance.data?.formatted ? parseFloat(ethBalance.data.formatted).toFixed(4) : '0.0000'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><DollarSign size={16} /><span>USDT</span></div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
                      {usdtBalance.data?.formatted ? parseFloat(usdtBalance.data.formatted).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {type === 'bid' ? 'Bid Amount' : 'Purchase Price'} ({currencyType ? 'USDT' : 'ETH'})
                </label>
                {type === 'buy' && nft ? (
                  <div className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{formatPriceFromWei(nft.price, nft.isUSDT)}</span>
                      <span className="text-sm text-gray-500">Fixed Price</span>
                    </div>
                  </div>
                ) : (
                  <input
                    type="number" 
                    step="0.001" 
                    placeholder={type === 'bid' ? "Enter your bid" : "Confirm amount"}
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                )}
                {type === 'bid' && auction && auction.currentBid > BigInt(0) && (
                  <p className="text-xs text-gray-500 mt-2">
                    Minimum bid: {formatPriceFromWei(auction.currentBid * BigInt(105) / BigInt(100), auction.isUSDT)}
                  </p>
                )}
              </div>
              
              {/* Sponsorship Toggle (ETH only) */}
              {type === 'bid' && !currencyType && isEnabled && (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="text-yellow-600 dark:text-yellow-400" size={20} />
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white">Gas-Free Bidding</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">We&apos;ll cover the gas fees for you!</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSponsorship}
                      onChange={(e) => setUseSponsorship(e.target.checked)}
                      className="sr-only peer"
                      disabled={isLoading}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              )}
              
              {/* Sponsorship Disabled for USDT */}
              {type === 'bid' && currencyType && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-center gap-3">
                  <Zap className="text-yellow-600 dark:text-yellow-400" size={20} />
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">Gas-Free Bidding Unavailable</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sponsorship is only available for ETH bids.</p>
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              <button
                onClick={handleAction}
                disabled={isLoading || (type === 'bid' && (!amount || isNaN(Number(amount)) || Number(amount) <= 0))}
                className={`w-full ${type === 'bid' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'} disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {usdtApprovalLoading ? 'Approving USDT...' : 'Processing...'}
                  </div>
                ) : (
                  type === 'bid' ? `Place Bid (${currencyType ? 'USDT' : 'ETH'})` : `Buy Now (${currencyType ? 'USDT' : 'ETH'})`
                )}
              </button>
              
              {/* Error */}
              {displayError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{displayError}</p>
                  <button onClick={clearError} className="text-red-600 dark:text-red-400 text-sm underline mt-1">Dismiss</button>
                </div>
              )}
              
              {/* Details */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-semibold mb-1">Transaction Details:</p>
                  <p>1. Confirm amount and currency</p>
                  {currencyType && (
                    <p>2. Approve USDT spending (if needed)</p>
                  )}
                  <p>3. Approve transaction in your wallet</p>
                  <p>4. {type === 'bid' ? "Bid will be placed" : "NFT will be transferred to your wallet"}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}