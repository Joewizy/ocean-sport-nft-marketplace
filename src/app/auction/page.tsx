"use client"

import { useState, useEffect } from "react"
import { useConfig, useAccount, useWriteContract, useReadContract } from "wagmi"
import { motion } from "framer-motion"
import { Clock, Users, Gavel, ExternalLink, Home, ShoppingBag, Plus, User, TrendingUp } from "lucide-react"
import { waitForTransactionReceipt, readContract } from "@wagmi/core"
import { nftMarketplaceAbi, nftMarketplaceAddress, oceansportAbi } from "@/contracts/constants"
import { LiveAuction, ContractAuction } from "@/utils/interfaces"
import { PlaceBidModal } from "@/components/PlaceBidModal"
import { NavBar } from "@/components/ui/tubelight-navbar"
import Image from "next/image"
import toast, { Toaster } from "react-hot-toast"

// Utility to parse '4.0 ETH' or '5.2 USDT' to BigInt in wei
function parseAmountToWei(amountStr: string): bigint {
  if (!amountStr) return BigInt(0);
  const num = parseFloat(amountStr);
  if (isNaN(num)) return BigInt(0);
  return BigInt(Math.floor(num * 1e18));
}

export default function AuctionPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 20,
    hours: 14,
    minutes: 32,
    seconds: 45
  })
  const [liveAuctions, setLiveAuctions] = useState<LiveAuction[]>([])
  const [contractAuctions, setContractAuctions] = useState<ContractAuction[]>([])
  const [featuredAuction, setFeaturedAuction] = useState<LiveAuction | null>(null)
  const [featuredContractAuction, setFeaturedContractAuction] = useState<ContractAuction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)
  const [selectedContractAuction, setSelectedContractAuction] = useState<ContractAuction | null>(null)
  const [userBids, setUserBids] = useState<{[auctionId: number]: {amount: string, isHighest: boolean}}>({})
  
  const config = useConfig()
  const account = useAccount()
  const { writeContractAsync } = useWriteContract()

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Marketplace', url: '/marketplace', icon: ShoppingBag },
    { name: 'Auction', url: '/auction', icon: Gavel },
    { name: 'Create', url: '/create', icon: Plus },
    { name: 'Profile', url: '/profile', icon: User },
  ]

  useEffect(() => {
    fetchAuctions()
  }, [])

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Check if current user is the highest bidder
  const checkUserBidStatus = (auction: any, accountAddress: string) => {
    if (!accountAddress || !auction.highestBidder) return false
    return auction.highestBidder.toLowerCase() === accountAddress.toLowerCase()
  }

  // Track user bid when placed
  const trackUserBid = (auctionId: number, amount: string) => {
    setUserBids(prev => ({
      ...prev,
      [auctionId]: { amount, isHighest: true }
    }))
  }

  // Handler to open modal for a given auction
  const handleOpenBidModal = (auction: ContractAuction) => {
    setSelectedContractAuction(auction)
    setIsBidModalOpen(true)
  }

  const fetchAuctions = async () => {
    try {
      setIsLoading(true)
      
      // Get current auction ID to know how many auctions exist
      const currentAuctionId = await readContract(config, {
        abi: nftMarketplaceAbi,
        address: nftMarketplaceAddress as `0x${string}`,
        functionName: "getAuctionId",
      }) as bigint

      const auctionPromises = []
      
      // Fetch all auctions
      for (let i = 1; i <= Number(currentAuctionId); i++) {
        auctionPromises.push(
          readContract(config, {
            abi: nftMarketplaceAbi,
            address: nftMarketplaceAddress as `0x${string}`,
            functionName: "getAuction",
            args: [BigInt(i)],
          })
        )
      }

      const auctions = await Promise.all(auctionPromises)
      
      // Filter active auctions and fetch metadata
      const activeAuctions: any[] = auctions
        .map((auction: any, index: number) => ({
          auctionId: index + 1,
          nftContract: auction.nftContract,
          tokenId: auction.tokenId.toString(),
          seller: auction.seller,
          startingPrice: auction.startingPrice,
          highestBid: auction.highestBid,
          highestBidder: auction.highestBidder,
          endTime: Number(auction.endTime),
          isUSDT: auction.isUSDT,
          active: auction.active,
        }))
        .filter((auction: any) => auction.active && auction.nftContract !== "0x0000000000000000000000000000000000000000")

      // Fetch metadata for each active auction
      const auctionDataPromises = activeAuctions.map(async (auction: any) => {
        try {
          const tokenURI = await readContract(config, {
            abi: oceansportAbi,
            address: auction.nftContract as `0x${string}`,
            functionName: "tokenURI",
            args: [BigInt(auction.tokenId)],
          })

          const metadata = await fetch(tokenURI as string).then(res => res.json())
          
          const currentTime = Math.floor(Date.now() / 1000)
          const timeRemaining = auction.endTime - currentTime
          const days = Math.floor(timeRemaining / 86400)
          const hours = Math.floor((timeRemaining % 86400) / 3600)
          const minutes = Math.floor((timeRemaining % 3600) / 60)
          
          const highestBidAmount = Number(auction.highestBid) / 1e18
          const startingPriceAmount = Number(auction.startingPrice) / 1e18
          const hasBids = highestBidAmount > 0
          const isUserHighestBidder = checkUserBidStatus(auction, account.address || '')
          
          // Build both LiveAuction and ContractAuction
          const liveAuction: LiveAuction = {
            id: auction.auctionId,
            title: metadata.name || `NFT #${auction.tokenId}`,
            image: metadata.image || '',
            description: metadata.description || '',
            artist: auction.seller.slice(0,10),
            currentBid: hasBids ? `${highestBidAmount.toFixed(4)} ${auction.isUSDT ? 'USDT' : 'ETH'}` : `${startingPriceAmount.toFixed(4)} ${auction.isUSDT ? 'USDT' : 'ETH'}`,
            startingPrice: `${startingPriceAmount.toFixed(4)} ${auction.isUSDT ? 'USDT' : 'ETH'}`,
            bidCount: hasBids ? 1 : 0,
            timeLeft: timeRemaining > 0 ? `${days}d ${hours}h ${minutes}m` : 'Ended',
            endTime: auction.endTime,
            hasBids: hasBids,
            currentBidUSD: hasBids ? `$${(highestBidAmount * (auction.isUSDT ? 1 : 2000)).toFixed(2)}` : undefined,
            isUserHighestBidder: isUserHighestBidder
          }
          const contractAuction: ContractAuction = {
            ...liveAuction,
            tokenId: auction.tokenId.toString(),
            isUSDT: auction.isUSDT
          }
          return { liveAuction, contractAuction }
        } catch (error) {
          console.error(`Error fetching metadata for auction ${auction.auctionId}:`, error)
          return null
        }
      })
      const resolvedAuctions = await Promise.all(auctionDataPromises)
      const validLiveAuctions = resolvedAuctions.filter((a: any) => a && a.liveAuction && a.liveAuction.image && a.liveAuction.title !== `NFT #${a.contractAuction.tokenId}` && a.liveAuction.timeLeft !== 'Ended').map((a: any) => a.liveAuction) as LiveAuction[]
      const validContractAuctions = resolvedAuctions.filter((a: any) => a && a.contractAuction && a.liveAuction.image && a.liveAuction.title !== `NFT #${a.contractAuction.tokenId}` && a.liveAuction.timeLeft !== 'Ended').map((a: any) => a.contractAuction) as ContractAuction[]
      setLiveAuctions(validLiveAuctions)
      setContractAuctions(validContractAuctions)
      if (validLiveAuctions.length > 0) {
        setFeaturedAuction(validLiveAuctions[0])
        setFeaturedContractAuction(validContractAuctions[0])
      } else {
        setFeaturedAuction(null)
        setFeaturedContractAuction(null)
      }
    } catch (error) {
      console.error('Error fetching auctions:', error)
      setFeaturedAuction(null)
      setFeaturedContractAuction(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-blue-900 dark:to-teal-900">
      <NavBar items={navItems} />
      
      {/* Header */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent mb-4">
              Live Auctions
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Bid on exclusive ocean-inspired NFTs and own a piece of digital marine art history
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Auction */}
      <section className="pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {featuredAuction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              {/* Auction Image */}
              <div className="relative aspect-[3/2] rounded-xl overflow-hidden">
                <Image
                  src={featuredAuction.image}
                  alt={featuredAuction.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
              </div>

              {/* Auction Details */}
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    {featuredAuction.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">
                    by {featuredAuction.artist}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
                    {featuredAuction.description}
                  </p>
                </div>

                {/* Countdown Timer */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-3 text-white">
                  <div className="text-center mb-2">
                    <Clock className="mx-auto mb-1" size={18} />
                    <h3 className="text-sm font-semibold">Auction Ends In</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div>
                      <div className="text-lg font-bold">{timeLeft.days}</div>
                      <div className="text-xs opacity-80">Days</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{timeLeft.hours}</div>
                      <div className="text-xs opacity-80">Hours</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{timeLeft.minutes}</div>
                      <div className="text-xs opacity-80">Minutes</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{timeLeft.seconds}</div>
                      <div className="text-xs opacity-80">Seconds</div>
                    </div>
                  </div>
                </div>

                {/* Current Bid or Starting Price */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {featuredAuction.hasBids ? (
                        <>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Current Bid</div>
                          <div className="text-2xl font-bold text-gray-800 dark:text-white">
                            {featuredAuction.currentBid}
                          </div>
                          {featuredAuction.currentBidUSD && (
                            <div className="text-gray-600 dark:text-gray-400">
                              {featuredAuction.currentBidUSD}
                            </div>
                          )}
                          {featuredAuction.isUserHighestBidder && (
                            <div className="text-sm text-green-600 dark:text-green-400 font-semibold mt-1">
                              🏆 You are the highest bidder!
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Starting Price</div>
                          <div className="text-2xl font-bold text-gray-800 dark:text-white">
                            {featuredAuction.startingPrice}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users size={16} />
                        <span>{featuredAuction.bidCount} bids</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 w-full"
                      onClick={() => featuredContractAuction && handleOpenBidModal(featuredContractAuction)}
                    >
                      <Gavel className="inline-block mr-2" size={18} />
                      Place Bid
                    </button>
                  </div>
                </div>

                {/* Bid History */}
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Recent Bids</h4>
                  <div className="space-y-2">
                    {featuredAuction.bidHistory?.map((bid: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="font-mono text-sm text-blue-600">{bid.bidder}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{bid.time}</div>
                        </div>
                        <div className="font-semibold text-gray-800 dark:text-white">{bid.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          )}
        </div>
      </section>

      {/* Live Auctions Grid */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              More Live Auctions
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Don't miss out on these exciting bidding opportunities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {liveAuctions.map((auction, index) => (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="relative aspect-square">
                  <Image
                    src={auction.image}
                    alt={auction.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2">
                    <Clock className="text-white" size={16} />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base text-gray-800 dark:text-white mb-1 truncate">{auction.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm truncate">by {auction.artist}</p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      {auction.hasBids ? (
                        <>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Current Bid</div>
                          <div className="text-lg font-bold text-blue-600">{auction.currentBid}</div>
                          {auction.isUserHighestBidder && (
                            <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                              🏆 Your bid
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Starting Price</div>
                          <div className="text-lg font-bold text-gray-600">{auction.startingPrice}</div>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 dark:text-gray-400">{auction.bidCount} bids</div>
                      <div className="text-xs font-semibold text-red-600">{auction.timeLeft}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleOpenBidModal(contractAuctions[index])}
                    >
                      Bid
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PlaceBidModal for bidding */}
      <PlaceBidModal
        isOpen={isBidModalOpen}
        onClose={() => {
          setIsBidModalOpen(false)
          // Refresh auctions after modal closes to show updated bid status
          fetchAuctions()
        }}
        auction={selectedContractAuction ? {
          id: selectedContractAuction.id,
          title: selectedContractAuction.title,
          image: selectedContractAuction.image,
          currentBid: parseAmountToWei(selectedContractAuction.currentBid),
          startingPrice: parseAmountToWei(selectedContractAuction.startingPrice),
          isUSDT: selectedContractAuction.isUSDT,
          tokenId: selectedContractAuction.tokenId,
        } : undefined}
        type="bid"
      />
      
      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 6000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  )
}