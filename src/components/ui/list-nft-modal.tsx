"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Tag, Clock, Gavel } from "lucide-react"
import { useNFTListing, useNFTAuction } from "@/hooks/useNFT"

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
  const [duration, setDuration] = useState('7') // days
  
  const { listNFT, isLoading: isListing, error: listError } = useNFTListing()
  const { createAuction, isLoading: isCreatingAuction, error: auctionError } = useNFTAuction()

  const handleFixedPriceListing = async () => {
    if (!price) return
    await listNFT(nft.id, price)
    if (!listError) {
      onClose()
    }
  }

  const handleAuctionListing = async () => {
    if (!startingBid || !duration) return
    const durationInSeconds = parseInt(duration) * 24 * 60 * 60 // Convert days to seconds
    await createAuction(nft.id, startingBid, durationInSeconds)
    if (!auctionError) {
      onClose()
    }
  }

  const isLoading = isListing || isCreatingAuction
  const error = listError || auctionError

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

              {/* Listing Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Listing Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setListingType('fixed')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      listingType === 'fixed'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Tag className="mx-auto mb-2 text-blue-600" size={24} />
                    <div className="text-sm font-semibold">Fixed Price</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Sell immediately</div>
                  </button>
                  
                  <button
                    onClick={() => setListingType('auction')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      listingType === 'auction'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Gavel className="mx-auto mb-2 text-purple-600" size={24} />
                    <div className="text-sm font-semibold">Auction</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Timed bidding</div>
                  </button>
                </div>
              </div>

              {/* Fixed Price Form */}
              {listingType === 'fixed' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="2.5"
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
                    {isLoading ? 'Listing...' : 'List for Fixed Price'}
                  </button>
                </div>
              )}

              {/* Auction Form */}
              {listingType === 'auction' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Starting Bid (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="1.0"
                      value={startingBid}
                      onChange={(e) => setStartingBid(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">1 Day</option>
                      <option value="3">3 Days</option>
                      <option value="7">7 Days</option>
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handleAuctionListing}
                    disabled={!startingBid || isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Auction...' : 'Create Auction'}
                  </button>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock className="text-blue-600 mt-0.5" size={16} />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Listing Process:</p>
                    <p>1. Approve marketplace contract</p>
                    <p>2. {listingType === 'fixed' ? 'List NFT at fixed price' : 'Create timed auction'}</p>
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
