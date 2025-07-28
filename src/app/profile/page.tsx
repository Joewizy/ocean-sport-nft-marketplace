"use client"

import Image from "next/image"
import { Home, ShoppingBag, Plus, User, Edit, Share2, Heart, Eye, Gavel, Tag } from "lucide-react"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { ListNFTModal } from "@/components/ui/list-nft-modal"
import { motion } from "framer-motion"
import { useState, useEffect, Suspense} from "react"
import { readContract } from "@wagmi/core";
import { oceansportAbi, oceansportAddress, nftMarketplaceAbi, nftMarketplaceAddress } from "@/contracts/constants"
import { useAccount, useConfig } from "wagmi"
import { FetchedNFTs } from "@/utils/interfaces"
import { useRouter, useSearchParams } from "next/navigation"
import { Toaster } from 'react-hot-toast'
import { formatPrice } from "@/utils/formatPrice"
import { NFTForModal } from "@/utils/interfaces"

function ProfileContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'collected' | 'created' | 'listed' | 'activity'>('collected')
  const [listingModal, setListingModal] = useState<{ isOpen: boolean; nft: NFTForModal | null }>({ 
    isOpen: false, 
    nft: null 
  })
  const [userNFT, setUserNft] = useState<FetchedNFTs[]>([]);
  const [listedNfts, setListedNfts] = useState<FetchedNFTs[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(true)


  const {address} = useAccount()
  const config = useConfig()
  const router = useRouter()



  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Marketplace', url: '/marketplace', icon: ShoppingBag },
    { name: 'Auction', url: '/auction', icon: Gavel },
    { name: 'Create', url: '/create', icon: Plus },
    { name: 'Profile', url: '/profile', icon: User },
  ]

  // Fetch listed NFTs from marketplace
  async function getListedNFTs() {
    try {
      if (!address) return console.warn("No connected wallet");
      
      // Get current listing ID to know how many listings exist
      const currentListingId = await readContract(config, {
        abi: nftMarketplaceAbi,
        address: nftMarketplaceAddress as `0x${string}`,
        functionName: "getListingId",
      }) as bigint

      const listingPromises = []
      
      // Fetch all listings
      for (let i = 1; i <= Number(currentListingId); i++) {
        listingPromises.push(
          readContract(config, {
            abi: nftMarketplaceAbi,
            address: nftMarketplaceAddress as `0x${string}`,
            functionName: "getListing",
            args: [BigInt(i)],
          })
        )
      }

      const listings = await Promise.all(listingPromises)
      
      // Filter listings by current user and active status
      const userListings = listings
        .map((listing: any, index: number) => ({
          listingId: index + 1,
          nftContract: listing.nftContract,
          tokenId: listing.tokenId.toString(),
          seller: listing.seller,
          price: listing.price,
          isUSDT: listing.isUSDT,
          active: listing.active,
        }))
        .filter((listing: { active: boolean; seller: string; nftContract: string }) => 
          listing.active && 
          listing.seller.toLowerCase() === address.toLowerCase() &&
          listing.nftContract !== "0x0000000000000000000000000000000000000000"
        )

      // Fetch metadata for each user listing
      const listedNFTPromises = userListings.map(async (listing: { listingId: number; nftContract: string; tokenId: string; seller: string; price: bigint; isUSDT: boolean; active: boolean }) => {
        try {
          const tokenURI = await readContract(config, {
            abi: oceansportAbi,
            address: listing.nftContract as `0x${string}`,
            functionName: "tokenURI",
            args: [BigInt(listing.tokenId)],
          })

          const metadata = await fetch(tokenURI as string).then(res => res.json())
          
          return {
            id: listing.tokenId,
            title: metadata.name || `NFT #${listing.tokenId}`,
            image: metadata.image || '',
            description: metadata.description || '',
            price: Number(listing.price) / 1e18,
            likes: 0,
            views: 0,
            listingId: listing.listingId,
            isUSDT: listing.isUSDT,
            priceString: formatPrice(Number(listing.price) / 1e18, listing.isUSDT)
          }
        } catch (error) {
          console.error(`Error fetching metadata for listing ${listing.listingId}:`, error)
          return null
        }
      })

      const resolvedListedNFTs = await Promise.all(listedNFTPromises)
      const validListedNFTs = resolvedListedNFTs.filter((nft: FetchedNFTs | null) => 
        nft && 
        nft.image && 
        nft.title !== `NFT #${nft.id}`
      ) as FetchedNFTs[]
      
      setListedNfts(validListedNFTs)
      
    } catch (error) {
      console.error('Error fetching listed NFTs:', error)
    }
  }

  useEffect(() => {
    if (address) {
      getUserNFTs()
      getListedNFTs()
    }
  }, [address])

  useEffect(() => {
    getUserNFTs()
  }, [address])

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['collected', 'created', 'listed', 'activity'].includes(tab)) {
      setActiveTab(tab as 'collected' | 'created' | 'listed' | 'activity')
    }
  }, [searchParams])

  async function getUserNFTs() {
    try {
      setIsLoadingNFTs(true)
      if (!address) return console.warn("No connected wallet");

      const balance = await readContract(config, {
        abi: oceansportAbi,
        address: oceansportAddress as `0x${string}`,
        functionName: "balanceOf",
        args: [address],
      });

      const nftPromises = Array.from({ length: Number(balance) }, async (_, i) => {
        const tokenId = await readContract(config, {
          abi: oceansportAbi,
          address: oceansportAddress as `0x${string}`,
          functionName: "tokenOfOwnerByIndex",
          args: [address, BigInt(i)],
        }) as string;

        const tokenURI = await readContract(config, {
          abi: oceansportAbi,
          address: oceansportAddress as `0x${string}`,
          functionName: "tokenURI",
          args: [tokenId],
        });

        const metadata = await fetch(tokenURI as string).then(res => res.json());

        const nft: FetchedNFTs = {
          id: tokenId.toString(),
          title: metadata.name || `NFT #${tokenId}`,
          image: metadata.image,
          description: metadata.description || "",
          price: parseFloat((Math.random() * 3 + 0.5).toFixed(2)), 
          likes: Math.floor(Math.random() * 50),
          views: Math.floor(Math.random() * 200),
        };

        return nft;
      });

      const resolvedNFTs = await Promise.all(nftPromises);
      setUserNft(resolvedNFTs);
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  // Helper function to convert FetchedNFTs to NFTForModal format
  const convertToModalFormat = (nft: FetchedNFTs): NFTForModal => ({
    id: parseInt(nft.id),
    title: nft.title,
    image: nft.image,
    currentPrice: `${nft.price} ETH`
  })

  const handleListNFT = (nft: FetchedNFTs) => {
    const modalNFT = convertToModalFormat(nft)
    setListingModal({ isOpen: true, nft: modalNFT })
  }

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
                    src="/batman avi.jpg"
                    alt="Profile"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                  <Edit size={16} />
                </button>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  Joewi.eth
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Computer engineer, blockchain developer and security researcher. 
                  Creating NFTs to raise awareness about the beauty of sports and nature as whole.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Create</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-600">{userNFT.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Collected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">24.5 ETH</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Volume</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <a 
                  href="https://twitter.com/BruceWayne82118"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Follow
                </a>
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
                { key: 'listed', label: 'Listed' },
                { key: 'activity', label: 'Activity' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'collected' | 'created' | 'listed' | 'activity')}
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
            >
              {isLoadingNFTs ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Loading Your Collection...</h3>
                  <p className="text-gray-600 dark:text-gray-400">Fetching your NFTs from the blockchain</p>
                </div>
              ) : userNFT.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userNFT.map((nft, index) => (
                  <div
                    key={nft.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={nft.image}
                        alt={nft.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">{nft.title}</h3>
                      {nft.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                          {nft.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xl font-bold text-blue-600">{nft.price} ETH</span>
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
                          onClick={() => handleListNFT(nft)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Tag size={14} />
                          List
                        </button>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">No NFTs in Collection</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    You haven&apos;t collected any NFTs yet. Start exploring the marketplace to find amazing digital art.
                  </p>
                  <button
                    onClick={() => router.push("/marketplace")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Explore Marketplace
                  </button>
                </div>
              )}
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
              <button
                onClick={() => router.push("/create")}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Create Your First NFT
              </button>
            </motion.div>
          )}

          {activeTab === 'listed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {listedNfts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listedNfts.map((nft: any) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={nft.image}
                          alt={nft.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          LISTED
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2 truncate">{nft.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm line-clamp-2">{nft.description}</p>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Listed Price</div>
                            <div className="text-lg font-bold text-green-600">{nft.priceString}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                            <div className="text-sm font-semibold text-green-600">Active</div>
                          </div>
                        </div>
                        <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-semibold">
                          Cancel Listing
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏷️</div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">No Listed NFTs</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    You haven&apos;t listed any NFTs for sale yet. Start by listing one of your collected NFTs.
                  </p>
                  <button
                    onClick={() => setActiveTab('collected')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    View Your Collection
                  </button>
                </div>
              )}
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
      
      {/* Toast Container */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-blue-900 dark:to-teal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Loading Profile...</h3>
          <p className="text-gray-600 dark:text-gray-400">Preparing your profile data</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}