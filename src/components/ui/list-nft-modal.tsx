"use client"

import { useState } from "react"
import { useConfig } from "wagmi"
import { motion, AnimatePresence } from "framer-motion"
import { X, Tag, Clock, Gavel, DollarSign, Coins } from "lucide-react"
import { waitForTransactionReceipt } from "@wagmi/core"
import { useAccount, useWriteContract } from "wagmi"
import { nftMarketplaceAbi, nftMarketplaceAddress, oceansportAddress } from "@/contracts/constants"
import { useMarketplaceApproval } from "@/hooks/useNFT"

interface ListNFTModalProps {
  isOpen: boolean
  onClose: () => void
  nft: {
    id: number
    title: string
    image: string
    currentPrice?: string
  }
}

export function ListNFTModal({ isOpen, onClose, nft }: ListNFTModalProps) {
  const [listingType, setListingType] = useState<'fixed' | 'auction'>('fixed')
  const [price, setPrice] = useState('')
  const [startingBid, setStartingBid] = useState('')
  const [duration, setDuration] = useState('7')
  const [isUSDT, setIsUSDT] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  
  const config = useConfig()
  const account = useAccount()
  const { writeContractAsync } = useWriteContract()
  
  // Use our custom approval hook
  const { 
    setApproval, 
    checkApproval, 
    isLoading: approvalLoading, 
    approvalError, 
    clearError: clearApprovalError 
  } = useMarketplaceApproval()

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
      // Check if marketplace is approved
      const isApproved = await checkApproval()
      
      if (!isApproved) {
        const approvalSuccess = await setApproval()
        if (!approvalSuccess) {
          setError("Failed to approve marketplace. Please try again.")
          setIsProcessing(false)
          return
        }
      }
      
      // Convert price to proper format (assuming 18 decimals)
      const priceInWei = BigInt(Math.floor(parseFloat(price) * 1e18))
      
      await listNft(priceInWei, nft.id.toString(), isUSDT)
      
      // Close modal on success
      onClose()
    } catch (err) {
      console.error('Error listing NFT:', err)
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
      // Check if marketplace is approved
      const isApproved = await checkApproval()
      
      if (!isApproved) {
        const approvalSuccess = await setApproval()
        if (!approvalSuccess) {
          setError("Failed to approve marketplace. Please try again.")
          setIsProcessing(false)
          return
        }
      }
      
      const durationInSeconds = parseInt(duration) * 24 * 60 * 60 // Convert days to seconds
      const priceInWei = BigInt(Math.floor(parseFloat(startingBid) * 1e18))
      
      await createAuction(priceInWei, nft.id.toString(), durationInSeconds, isUSDT)
      
      // Close modal on success
      onClose()
    } catch (err) {
      console.error('Error creating auction:', err)
      setError("Failed to create auction. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  async function createAuction(startingPrice: bigint, tokenId: string, duration: number, isUSDT: boolean) {
    try {
      const auctionHash = await writeContractAsync({
        abi: nftMarketplaceAbi,
        address: nftMarketplaceAddress as `0x${string}`,
        functionName: "createAuction",
        args: [oceansportAddress, BigInt(tokenId), startingPrice, BigInt(duration), isUSDT],
      })
    
      const auctionReceipt = await waitForTransactionReceipt(config, { hash: auctionHash })
      if (auctionReceipt) {
        console.log("Auction successfully created", auctionReceipt.transactionHash)
      }
    } catch (error) {
      console.error("Error creating auction:", error)
      throw error
    }
  }

  async function listNft(price: bigint, tokenId: string, isUSDT: boolean) {
    try {
      const listNFTHash = await writeContractAsync({
        abi: nftMarketplaceAbi,
        address: nftMarketplaceAddress as `0x${string}`,
        functionName: "listNFT",
        args: [oceansportAddress, BigInt(tokenId), price, isUSDT],
      })
    
      const listNFTReceipt = await waitForTransactionReceipt(config, { hash: listNFTHash })
      if (listNFTReceipt) {
        console.log("NFT successfully listed", listNFTReceipt.transactionHash)
      }
    } catch (error) {
      console.error("Error listing NFT:", error)
      throw error
    }
  }

  const isLoading = isProcessing || approvalLoading
  const displayError = error || approvalError

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
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

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* NFT Preview */}
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

              {/* Currency Selection */}
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

              {/* Listing Type Selection */}
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

              {/* Fixed Price Form */}
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleFixedPriceListing}
                    disabled={!price || isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : `List for ${isUSDT ? 'USDT' : 'ETH'}`}
                  </button>
                </div>
              )}

              {/* Auction Form */}
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
                    <input
                      type="number"
                      min="1"
                      max="365"
                      placeholder="7"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter number of days (1-365)</p>
                  </div>
                  
                  <button
                    onClick={handleAuctionListing}
                    disabled={!startingBid || isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : `Create ${isUSDT ? 'USDT' : 'ETH'} Auction`}
                  </button>
                </div>
              )}

              {/* Error Display */}
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

              {/* Info */}
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