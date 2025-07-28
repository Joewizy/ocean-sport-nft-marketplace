"use client"

import Image from "next/image"
import { Home, ShoppingBag, Plus, User, Clock, Gavel, TrendingUp, Users } from "lucide-react"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useConfig } from "wagmi"
import { readContract } from "@wagmi/core"
import { nftMarketplaceAbi, nftMarketplaceAddress, oceansportAbi } from "@/contracts/constants"
import { LiveAuction } from "@/utils/interfaces"

export default function AuctionPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 20,
    hours: 14,
    minutes: 32,
    seconds: 45
  })
  const [liveAuctions, setLiveAuctions] = useState<LiveAuction[]>([])
  const [featuredAuction, setFeaturedAuction] = useState<LiveAuction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const config = useConfig()

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
      const activeAuctions = auctions
        .map((auction: any, index) => ({
          auctionId: index + 1,
          nftContract: auction.nftContract,
          tokenId: auction.tokenId.toString(),
          seller: auction.seller,
          startingPrice: auction.startingPrice,
          currentBid: auction.currentBid,
          endTime: Number(auction.endTime),
          isUSDT: auction.isUSDT,
          active: auction.active,
        }))
        .filter(auction => auction.active && auction.nftContract !== "0x0000000000000000000000000000000000000000")

      // Fetch metadata for each active auction
      const auctionDataPromises = activeAuctions.map(async (auction) => {
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
          
          const currentBidAmount = Number(auction.currentBid) / 1e18
          const hasBids = currentBidAmount > 0
          
          return {
            id: auction.auctionId,
            title: metadata.name || `NFT #${auction.tokenId}`,
            image: metadata.image || '',
            description: metadata.description || '',
            artist: auction.seller.slice(0,10),
            currentBid: hasBids ? `${currentBidAmount.toFixed(4)} ${auction.isUSDT ? 'USDT' : 'ETH'}` : '',
            startingPrice: `${(Number(auction.startingPrice) / 1e18).toFixed(4)} ${auction.isUSDT ? 'USDT' : 'ETH'}`,
            bidCount: hasBids ? 1 : 0,
            timeLeft: timeRemaining > 0 ? `${days}d ${hours}h ${minutes}m` : 'Ended',
            endTime: auction.endTime,
            hasBids: hasBids
          }
        } catch (error) {
          console.error(`Error fetching metadata for auction ${auction.auctionId}:`, error)
          return null
        }
      })

      const resolvedAuctions = await Promise.all(auctionDataPromises)
      const validAuctions = resolvedAuctions.filter(auction => 
        auction && 
        auction.image && 
        auction.title !== `NFT #${auction.id}` &&
        auction.timeLeft !== 'Ended'
      ) as LiveAuction[]
      
      setLiveAuctions(validAuctions)
      
      // Set featured auction (first valid auction or fallback)
      if (validAuctions.length > 0) {
        setFeaturedAuction(validAuctions[0])
      } else {
        // Fallback featured auction if no real auctions
        setFeaturedAuction({
          id: 1,
          title: "Whale Migration #003",
          artist: "OceanWatcher",
          description: "A breathtaking capture of humpback whales during their annual migration.",
          currentBid: "5.2 ETH",
          startingPrice: "4.0 ETH", 
          currentBidUSD: "$8,840",
          bidCount: 12,
          timeLeft: "2d 14h 32m",
          image: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=800&fit=crop&crop=center",
          endTime: Math.floor(Date.now() / 1000) + 86400 * 2,
          hasBids: true,
          bidHistory: [
            { bidder: "0x1234...5678", amount: "5.2 ETH", time: "2 minutes ago" },
            { bidder: "0x8765...4321", amount: "5.0 ETH", time: "15 minutes ago" },
            { bidder: "0x9876...1234", amount: "4.8 ETH", time: "1 hour ago" },
          ]
        })
      }
      
    } catch (error) {
      console.error('Error fetching auctions:', error)
      // Set fallback data on error
      setFeaturedAuction({
        id: 1,
        title: "Whale Migration #003",
        artist: "OceanWatcher",
        description: "A breathtaking capture of humpback whales during their annual migration.",
        currentBid: "5.2 ETH",
        startingPrice: "4.0 ETH",
        currentBidUSD: "$8,840",
        bidCount: 12,
        timeLeft: "2d 14h 32m",
        image: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=800&fit=crop&crop=center",
        endTime: Math.floor(Date.now() / 1000) + 86400 * 2,
        hasBids: true, 
        bidHistory: [
          { bidder: "0x1234...5678", amount: "5.2 ETH", time: "2 minutes ago" },
          { bidder: "0x8765...4321", amount: "5.0 ETH", time: "15 minutes ago" },
          { bidder: "0x9876...1234", amount: "4.8 ETH", time: "1 hour ago" },
        ]
      })
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
                          <div className="text-gray-600 dark:text-gray-400">
                            {featuredAuction.currentBidUSD}
                          </div>
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
                    <input
                      type="number"
                      placeholder="Enter bid amount"
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
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
                  
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg transition-colors text-sm">
                    <Gavel className="inline-block mr-1" size={14} />
                    Place Bid
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}