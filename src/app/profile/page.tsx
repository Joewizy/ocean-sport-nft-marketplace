"use client"

import Image from "next/image"
import { Home, ShoppingBag, Plus, User, Edit, Share2, Heart, Eye, Gavel, Tag } from "lucide-react"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { ListNFTModal } from "@/components/ui/list-nft-modal"
import { motion } from "framer-motion"
import { useState } from "react"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'collected' | 'created' | 'activity'>('collected')
  const [listingModal, setListingModal] = useState<{ isOpen: boolean; nft: any }>({ isOpen: false, nft: null })

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Marketplace', url: '/marketplace', icon: ShoppingBag },
    { name: 'Auction', url: '/auction', icon: Gavel },
    { name: 'Create', url: '/create', icon: Plus },
    { name: 'Profile', url: '/profile', icon: User },
  ]

  const userNFTs = [
    {
      id: 1,
      title: "Ocean Waves #001",
      price: "2.5 ETH",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center",
      likes: 24,
      views: 156
    },
    {
      id: 2,
      title: "Deep Sea Explorer",
      price: "1.8 ETH",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop&crop=center",
      likes: 18,
      views: 89
    },
    {
      id: 3,
      title: "Coral Reef Dreams",
      price: "3.2 ETH",
      image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=400&fit=crop&crop=center",
      likes: 31,
      views: 203
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-blue-900 dark:to-teal-900">
      <NavBar items={navItems} />
      
      {/* Profile Header */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
                    alt="Profile"
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                  <Edit size={16} />
                </button>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  OceanExplorer.eth
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Marine photographer and digital artist passionate about ocean conservation. 
                  Creating NFTs to raise awareness about the beauty of our underwater world.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-600">8</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Collected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">24.5 ETH</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Volume</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                  Follow
                </button>
                <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg mb-8"
          >
            <div className="flex">
              {[
                { key: 'collected', label: 'Collected' },
                { key: 'created', label: 'Created' },
                { key: 'activity', label: 'Activity' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'collected' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {userNFTs.map((nft, index) => (
                <div
                  key={nft.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={nft.image}
                      alt={nft.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">{nft.title}</h3>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl font-bold text-blue-600">{nft.price}</span>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Heart size={14} />
                          {nft.likes}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          {nft.views}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
                        View Details
                      </button>
                      <button 
                        onClick={() => setListingModal({ isOpen: true, nft })}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Tag size={14} />
                        List
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'created' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">No Created NFTs Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Start creating your first ocean-inspired NFT and share your art with the world.
              </p>
              <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                Create Your First NFT
              </button>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-4"
            >
              {[
                { action: 'Purchased', item: 'Ocean Waves #001', time: '2 hours ago', price: '2.5 ETH' },
                { action: 'Listed', item: 'Deep Sea Explorer', time: '1 day ago', price: '1.8 ETH' },
                { action: 'Liked', item: 'Coral Reef Dreams', time: '3 days ago', price: null },
                { action: 'Followed', item: 'MarineArtist', time: '1 week ago', price: null }
              ].map((activity, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-gray-800 dark:text-white">
                      <span className="font-semibold">{activity.action}</span> {activity.item}
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                  {activity.price && (
                    <div className="text-blue-600 font-semibold">{activity.price}</div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* List NFT Modal */}
      <ListNFTModal
        isOpen={listingModal.isOpen}
        onClose={() => setListingModal({ isOpen: false, nft: null })}
        nft={listingModal.nft || { id: 0, title: '', image: '' }}
      />
    </div>
  )
}
