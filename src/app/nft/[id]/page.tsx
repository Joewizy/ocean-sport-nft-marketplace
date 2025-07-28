"use client"

import Image from "next/image"
import { Home, ShoppingBag, Plus, User, Heart, Share2, Eye, TrendingUp, Gavel } from "lucide-react"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { motion } from "framer-motion"
import { useState } from "react"
import { useParams } from "next/navigation"

export default function NFTDetailsPage() {
  const params = useParams()
  const [isLiked, setIsLiked] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'bids'>('details')

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Marketplace', url: '/marketplace', icon: ShoppingBag },
    { name: 'Auction', url: '/auction', icon: Gavel },
    { name: 'Create', url: '/create', icon: Plus },
    { name: 'Profile', url: '/profile', icon: User },
  ]

  // Mock NFT data - in real app, this would come from your API/blockchain
  const nft = {
    id: params.id,
    title: "Ocean Waves #001",
    description: "A stunning capture of the ocean's raw power and beauty. This piece represents the eternal dance between water and light, showcasing the magnificent blues and whites that make our oceans so captivating. Shot during golden hour off the coast of Hawaii, this NFT embodies the spirit of marine conservation and the beauty we must protect.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=800&fit=crop&crop=center",
    artist: {
      name: "AquaArtist",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      verified: true
    },
    price: "2.5 ETH",
    priceUSD: "$4,250",
    category: "Photography",
    likes: 24,
    views: 156,
    created: "2024-01-15",
    blockchain: "Base Sepolia",
    tokenId: "12345",
    contractAddress: "0x1234...5678",
    royalties: "10%",
    metadata: {
      attributes: [
        { trait_type: "Location", value: "Hawaii" },
        { trait_type: "Time of Day", value: "Golden Hour" },
        { trait_type: "Weather", value: "Clear" },
        { trait_type: "Wave Height", value: "3-4 feet" },
        { trait_type: "Rarity", value: "Rare" }
      ]
    },
    history: [
      { event: "Minted", from: null, to: "AquaArtist", price: null, date: "2024-01-15" },
      { event: "Listed", from: "AquaArtist", to: null, price: "2.5 ETH", date: "2024-01-16" }
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-blue-900 dark:to-teal-900">
      <NavBar items={navItems} />
      
      {/* Main Content */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* NFT Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={nft.image}
                  alt={nft.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`transition-colors ${isLiked ? 'text-red-500' : 'text-white'}`}
                  >
                    <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 text-center">
                  <Eye className="mx-auto mb-2 text-blue-600" size={20} />
                  <div className="text-lg font-bold text-gray-800 dark:text-white">{nft.views}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Views</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 text-center">
                  <Heart className="mx-auto mb-2 text-red-500" size={20} />
                  <div className="text-lg font-bold text-gray-800 dark:text-white">{nft.likes}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 text-center">
                  <TrendingUp className="mx-auto mb-2 text-green-500" size={20} />
                  <div className="text-lg font-bold text-gray-800 dark:text-white">+15%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">24h</div>
                </div>
              </div>
            </motion.div>

            {/* NFT Details */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                    {nft.category}
                  </span>
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                    {nft.blockchain}
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">{nft.title}</h1>
                
                {/* Artist Info */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={nft.artist.avatar}
                      alt={nft.artist.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 dark:text-white">{nft.artist.name}</span>
                      {nft.artist.verified && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Creator</span>
                  </div>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="mb-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Price</div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-800 dark:text-white">{nft.price}</span>
                    <span className="text-lg text-gray-600 dark:text-gray-400">{nft.priceUSD}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                    Buy Now
                  </button>
                  <button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300">
                    <Gavel className="inline-block mr-2" size={18} />
                    Place Bid
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors">
                    Make Offer
                  </button>
                  <button className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 p-2 rounded-lg transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                  {[
                    { key: 'details', label: 'Details' },
                    { key: 'history', label: 'History' },
                    { key: 'bids', label: 'Bids' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`px-4 py-2 font-semibold transition-colors ${
                        activeTab === tab.key
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 dark:text-gray-400 hover:text-blue-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {nft.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Contract Address:</span>
                        <div className="font-mono text-blue-600">{nft.contractAddress}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Token ID:</span>
                        <div className="font-mono">{nft.tokenId}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Royalties:</span>
                        <div>{nft.royalties}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Created:</span>
                        <div>{nft.created}</div>
                      </div>
                    </div>

                    {/* Attributes */}
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Attributes</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {nft.metadata.attributes.map((attr, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              {attr.trait_type}
                            </div>
                            <div className="font-semibold text-gray-800 dark:text-white">
                              {attr.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-3">
                    {nft.history.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="font-semibold text-gray-800 dark:text-white">{event.event}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {event.from && `From ${event.from}`} {event.to && `To ${event.to}`}
                          </div>
                        </div>
                        <div className="text-right">
                          {event.price && (
                            <div className="font-semibold text-blue-600">{event.price}</div>
                          )}
                          <div className="text-sm text-gray-600 dark:text-gray-400">{event.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'bids' && (
                  <div className="text-center py-8">
                    <Gavel className="mx-auto mb-4 text-gray-400" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No Bids Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400">Be the first to place a bid on this NFT!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
