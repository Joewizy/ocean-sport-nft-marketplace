"use client"

import Image from "next/image"
import { Home, ShoppingBag, Plus, User, Search, Filter, Grid, List, Gavel, DollarSign, Coins } from "lucide-react"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useConfig, useAccount, useWriteContract } from "wagmi"
import { readContract, waitForTransactionReceipt } from "@wagmi/core"
import { nftMarketplaceAbi, nftMarketplaceAddress, oceansportAbi, oceansportAddress } from "@/contracts/constants"

interface ListedNFT {
  listingId: number
  nftContract: string
  tokenId: string
  seller: string
  price: bigint
  isUSDT: boolean
  active: boolean
  // Metadata from IPFS
  title: string
  image: string
  description: string
  artist?: string
}

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [listedNFTs, setListedNFTs] = useState<ListedNFT[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState<'all' | 'eth' | 'usdt'>('all')
  const [isProcessingPurchase, setIsProcessingPurchase] = useState<number | null>(null)

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
    fetchListedNFTs()
  }, [])

  const fetchListedNFTs = async () => {
    try {
      setIsLoading(true)
      
      // Get the current listing ID to know how many listings exist
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
      
      // Filter active listings and fetch metadata
      const activeListings = listings
        .map((listing: any, index) => ({
          listingId: index + 1,
          nftContract: listing.nftContract,
          tokenId: listing.tokenId.toString(),
          seller: listing.seller,
          price: listing.price,
          isUSDT: listing.isUSDT,
          active: listing.active,
        }))
        .filter(listing => listing.active && listing.nftContract !== "0x0000000000000000000000000000000000000000")

      // Fetch metadata for each active listing
      const nftDataPromises = activeListings.map(async (listing) => {
        try {
          const tokenURI = await readContract(config, {
            abi: oceansportAbi,
            address: listing.nftContract as `0x${string}`,
            functionName: "tokenURI",
            args: [BigInt(listing.tokenId)],
          })

          const metadata = await fetch(tokenURI as string).then(res => res.json())
          
          return {
            ...listing,
            title: metadata.name || `NFT #${listing.tokenId}`,
            image: metadata.image || '',
            description: metadata.description || '',
            artist: listing.seller.slice(0,10) || '0xOcean'
          }
        } catch (error) {
          console.error(`Error fetching metadata for listing ${listing.listingId}:`, error)
          return {
            ...listing,
            title: `NFT #${listing.tokenId}`,
            image: '',
            description: '',
            artist: 'Unknown Artist'
          }
        }
      })

      const nftsWithMetadata = await Promise.all(nftDataPromises)
      setListedNFTs(nftsWithMetadata)
    } catch (error) {
      console.error('Error fetching listed NFTs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async (listingId: number, price: bigint, isUSDT: boolean) => {
    if (!account.address) {
      alert('Please connect your wallet')
      return
    }

    setIsProcessingPurchase(listingId)
    
    try {
      const buyHash = await writeContractAsync({
        abi: nftMarketplaceAbi,
        address: nftMarketplaceAddress as `0x${string}`,
        functionName: "buyNFT",
        args: [BigInt(listingId)],
        value: isUSDT ? BigInt(0) : price, // Send ETH if not USDT
      })

      const receipt = await waitForTransactionReceipt(config, { hash: buyHash })
      
      if (receipt) {
        alert('NFT purchased successfully!')
        fetchListedNFTs() // Refresh the listings
      }
    } catch (error) {
      console.error('Error purchasing NFT:', error)
      alert('Failed to purchase NFT. Please try again.')
    } finally {
      setIsProcessingPurchase(null)
    }
  }

  const formatPrice = (price: bigint, isUSDT: boolean) => {
    const formattedPrice = (Number(price) / 1e18).toFixed(4)
    return `${formattedPrice} ${isUSDT ? 'USDT' : 'ETH'}`
  }

  const filteredNFTs = listedNFTs.filter(nft => {
    const matchesSearch = nft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nft.artist?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCurrency = selectedCurrency === 'all' || 
                           (selectedCurrency === 'eth' && !nft.isUSDT) ||
                           (selectedCurrency === 'usdt' && nft.isUSDT)
    
    return matchesSearch && matchesCurrency
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-blue-900 dark:to-teal-900">
        <NavBar items={navItems} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading marketplace...</p>
          </div>
        </div>
      </div>
    )
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
              Marketplace
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover and collect unique ocean-inspired NFTs from artists around the world
            </p>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search NFTs, artists, collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-4">
                {/* Currency Filter */}
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => setSelectedCurrency('all')}
                    className={`px-3 py-2 text-sm ${selectedCurrency === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'} transition-colors`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedCurrency('eth')}
                    className={`px-3 py-2 text-sm flex items-center gap-1 ${selectedCurrency === 'eth' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'} transition-colors`}
                  >
                    <Coins size={14} />
                    ETH
                  </button>
                  <button
                    onClick={() => setSelectedCurrency('usdt')}
                    className={`px-3 py-2 text-sm flex items-center gap-1 ${selectedCurrency === 'usdt' ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'} transition-colors`}
                  >
                    <DollarSign size={14} />
                    USDT
                  </button>
                </div>
                
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Filter size={18} />
                  Filter
                </button>
                
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'} transition-colors`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'} transition-colors`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              {filteredNFTs.length} NFT{filteredNFTs.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
      </section>

      {/* NFT Grid */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {filteredNFTs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌊</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">No NFTs Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {searchTerm ? 'Try adjusting your search terms' : 'No NFTs are currently listed in the marketplace'}
              </p>
            </div>
          ) : (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-8`}>
              {filteredNFTs.map((nft, index) => (
                <motion.div
                  key={nft.listingId}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${
                    viewMode === 'list' ? 'flex flex-row' : ''
                  }`}
                >
                  <div className={`relative ${viewMode === 'list' ? 'w-48 h-48' : 'aspect-square'}`}>
                    {nft.image ? (
                      <Image
                        src={nft.image}
                        alt={nft.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        nft.isUSDT 
                          ? 'bg-green-600 text-white' 
                          : 'bg-blue-600 text-white'
                      }`}>
                        {nft.isUSDT ? 'USDT' : 'ETH'}
                      </div>
                    </div>
                  </div>
                  <div className={`p-6 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">{nft.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">by {nft.artist}</p>
                      {nft.description && viewMode === 'list' && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{nft.description}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(nft.price, nft.isUSDT)}
                      </span>
                      <button
                        onClick={() => handlePurchase(nft.listingId, nft.price, nft.isUSDT)}
                        disabled={isProcessingPurchase === nft.listingId || nft.seller.toLowerCase() === account.address?.toLowerCase()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        {isProcessingPurchase === nft.listingId ? 'Processing...' : 
                         nft.seller.toLowerCase() === account.address?.toLowerCase() ? 'Your NFT' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}