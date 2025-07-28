"use client"

import { useState } from "react"
import { useConfig } from "wagmi"
import { motion, AnimatePresence } from "framer-motion"
import { X, Tag, Clock, Gavel, DollarSign, Coins, Zap } from "lucide-react"
import { waitForTransactionReceipt } from "@wagmi/core"
import { useAccount, useWriteContract } from "wagmi"
import { nftMarketplaceAbi, nftMarketplaceAddress, oceansportAddress } from "@/contracts/constants"
import { useMarketplaceApproval } from "@/hooks/useNFT"
import { useRouter } from "next/navigation"
import toast from 'react-hot-toast'
import { ListNFTModalProps } from "@/utils/interfaces"
import { useNFTOperations } from "@/hooks/useGasSponsorship"
import { ExternalLink } from "lucide-react";

export function ListNFTModal({ isOpen, onClose, nft }: ListNFTModalProps) {
  const [listingType, setListingType] = useState<'fixed' | 'auction'>('fixed')
  const [price, setPrice] = useState('')
  const [startingBid, setStartingBid] = useState('')
  const [duration, setDuration] = useState('7')
  const [isUSDT, setIsUSDT] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [useSponsorship, setUseSponsorship] = useState(true)

  const config = useConfig()
  const account = useAccount()
  const { writeContractAsync } = useWriteContract()
  const router = useRouter()
  const { 
    setApproval, 
    checkApproval, 
    isLoading: approvalLoading, 
    approvalError, 
    clearError: clearApprovalError 
  } = useMarketplaceApproval()
  const { sponsoredListNFT, sponsoredCreateAuction, isSponsoring, isEnabled } = useNFTOperations()

  const clearError = () => {
    setError('')
    clearApprovalError()
  }

  const handleFixedPriceListing = async () => {
    if (!price) {
      setError("Please enter a price")
      return
    }
    
    setIsProcessing(true)
    clearError()
    
    try {
      const isApproved = await checkApproval()
      if (!isApproved) {
        const approvalSuccess = await setApproval()
        if (!approvalSuccess) {
          setError("Failed to approve marketplace. Please try again.")
          setIsProcessing(false)
          return
        }
      }

      const priceInWei = BigInt(Math.floor(parseFloat(price) * 1e18))
      let txHash: string

      if (useSponsorship && isEnabled) {
        txHash = await sponsoredListNFT(
          nftMarketplaceAddress,
          oceansportAddress,
          nft.id.toString(),
          priceInWei.toString(),
          isUSDT
        )
      } else {
        txHash = await writeContractAsync({
          abi: nftMarketplaceAbi,
          address: nftMarketplaceAddress as `0x${string}`,
          functionName: "listNFT",
          args: [oceansportAddress, BigInt(nft.id), priceInWei, isUSDT],
        })
      }

      const receipt = await waitForTransactionReceipt(config, { hash: txHash as `0x${string}` })
      if (receipt) {
        console.log("NFT successfully listed", receipt.transactionHash)
        toast.success(
          <div className="flex flex-col gap-2">
            <span>NFT listed successfully!</span>
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
        );
        onClose()
        setTimeout(() => {
          router.push('/profile?tab=listed')
        }, 1500)
      }
    } catch (err) {
      console.error('Error listing NFT:', err)
      toast.error('Failed to list NFT. Please try again.')
      setError("Failed to list NFT. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAuctionListing = async () => {
    if (!startingBid || !duration) {
      setError("Please fill all fields")
      return
    }
    
    setIsProcessing(true)
    clearError()
    
    try {
      const isApproved = await checkApproval()
      if (!isApproved) {
        const approvalSuccess = await setApproval()
        if (!approvalSuccess) {
          setError("Failed to approve marketplace. Please try again.")
          setIsProcessing(false)
          return
        }
      }
      
      const durationInSeconds = parseInt(duration) * 24 * 60 * 60
      const priceInWei = BigInt(Math.floor(parseFloat(startingBid) * 1e18))
      let txHash: string

      if (useSponsorship && isEnabled) {
        txHash = await sponsoredCreateAuction(
          nftMarketplaceAddress,
          oceansportAddress,
          nft.id.toString(),
          priceInWei.toString(),
          BigInt(durationInSeconds).toString(),
          isUSDT
        )
      } else {
        txHash = await writeContractAsync({
          abi: nftMarketplaceAbi,
          address: nftMarketplaceAddress as `0x${string}`,
          functionName: "createAuction",
          args: [oceansportAddress, BigInt(nft.id), priceInWei, BigInt(durationInSeconds), isUSDT],
        })
      }

      const receipt = await waitForTransactionReceipt(config, { hash: txHash as `0x${string}` })
      if (receipt) {
        console.log("Auction successfully created", receipt.transactionHash)
        toast.success(
        <div className="flex flex-col gap-2">
          <span>Auction listed successfully!</span>
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
      );
        onClose()
        setTimeout(() => {
          router.push('/auction')
        }, 1500)
      }
    } catch (err) {
      console.error('Error creating auction:', err)
      toast.error('Failed to create auction. Please try again.')
      setError("Failed to create auction. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const isLoading = isProcessing || approvalLoading || isSponsoring
  const displayError = error || approvalError

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                List NFT for Sale
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <img
                  src={nft.image}
                  alt={nft.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{nft.title}</h3>
                  {nft.currentPrice && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current: {nft.currentPrice}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Currency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsUSDT(false)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      !isUSDT
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Coins size={18} />
                    <span className="font-medium">ETH</span>
                  </button>
                  <button
                    onClick={() => setIsUSDT(true)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      isUSDT
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign size={18} />
                    <span className="font-medium">USDT</span>
                  </button>
                </div>
              </div>

              {isEnabled && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="text-yellow-600 dark:text-yellow-400" size={16} />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Gas-free listing available
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSponsorship}
                      onChange={(e) => setUseSponsorship(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Listing Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setListingType('fixed')}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      listingType === 'fixed'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Tag size={18} />
                    <span className="font-medium">Fixed Price</span>
                  </button>
                  <button
                    onClick={() => setListingType('auction')}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      listingType === 'auction'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Gavel size={18} />
                    <span className="font-medium">Auction</span>
                  </button>
                </div>
              </div>

              {listingType === 'fixed' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price ({isUSDT ? 'USDT' : 'ETH'})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder={isUSDT ? "100" : "2.5"}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px Tamil Nadu-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleFixedPriceListing}
                    disabled={!price || isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : (useSponsorship && isEnabled ? `List for ${isUSDT ? 'USDT' : 'ETH'} (Gas-Free)` : `List for ${isUSDT ? 'USDT' : 'ETH'}`)}
                  </button>
                </div>
              )}

              {listingType === 'auction' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Starting Bid ({isUSDT ? 'USDT' : 'ETH'})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder={isUSDT ? "50" : "1.0"}
                      value={startingBid}
                      onChange={(e) => setStartingBid(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (days)
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">1 Day</option>
                      <option value="3">3 Days</option>
                      <option value="7">7 Days (1 Week)</option>
                      <option value="14">14 Days (2 Weeks)</option>
                      <option value="30">30 Days (1 Month)</option>
                      <option value="60">60 Days (2 Months)</option>
                      <option value="90">90 Days (3 Months)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Choose auction duration</p>
                  </div>
                  <button
                    onClick={handleAuctionListing}
                    disabled={!startingBid || isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : (useSponsorship && isEnabled ? `Create ${isUSDT ? 'USDT' : 'ETH'} Auction (Gas-Free)` : `Create ${isUSDT ? 'USDT' : 'ETH'} Auction`)}
                  </button>
                </div>
              )}

              {displayError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{displayError}</p>
                  <button
                    onClick={clearError}
                    className="text-red-600 dark:text-red-400 text-sm underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock className="text-blue-600 mt-0.5" size={16} />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Listing Process:</p>
                    <p>1. Approve marketplace contract (if needed)</p>
                    <p>2. {listingType === 'fixed' ? `List NFT at fixed ${isUSDT ? 'USDT' : 'ETH'} price` : `Create timed ${isUSDT ? 'USDT' : 'ETH'} auction`}</p>
                    <p>3. NFT appears in marketplace</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}