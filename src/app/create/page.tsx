"use client"

import { Home, ShoppingBag, Plus, User, Upload, Gavel, ExternalLink, CheckCircle, X, Zap } from "lucide-react"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { motion } from "framer-motion"
import { useState } from "react"
import { useAccount, useConfig, useWriteContract } from "wagmi"
import { oceansportAbi, oceansportAddress } from "@/contracts/constants"
import { waitForTransactionReceipt } from "@wagmi/core"
import { useRouter } from "next/navigation"
import toast, { Toaster } from 'react-hot-toast'
import NFTPreview from "@/components/NFTPreview"
import { useNFTOperations } from "@/hooks/useGasSponsorship"
import { ChainValidation } from "@/components/ChainValidation"

export default function CreatePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [croppedFile, setCroppedFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [nftTx, setNftTx] = useState<string | `0x${string}`>()
  const [useSponsorship, setUseSponsorship] = useState(true)

  const account = useAccount()
  const config = useConfig()
  const { writeContractAsync } = useWriteContract()
  const { sponsoredMint, isSponsoring, isEnabled } = useNFTOperations()
  const router = useRouter()

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Marketplace', url: '/marketplace', icon: ShoppingBag },
    { name: 'Auction', url: '/auction', icon: Gavel },
    { name: 'Create', url: '/create', icon: Plus },
    { name: 'Profile', url: '/profile', icon: User },
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreview(null)
    setCroppedFile(null)
  }

  const handleCroppedImage = (croppedFile: File) => {
    setCroppedFile(croppedFile)
    toast.success("Crop applied! This version will be used for minting.")
  }

  const triggerFileSelect = () => {
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    fileInput?.click()
  }

  async function handleMint() {
    const fileToMint = croppedFile || selectedFile
    
    if (!name || !fileToMint) {
      toast.error("Please enter a name and upload a file.")
      return
    }

    if (!account.address) {
      toast.error("Please connect your wallet.")
      return
    }

    try {
      setIsUploading(true)
      
      // Convert file to base64 Data URL to pass in JSON
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(fileToMint)
      })

      // Upload metadata to IPFS
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, image: base64Image }),
      })
      const { tokenURI } = await response.json()

      let mintHash: string
      console.log("Token URI is:", tokenURI)

      // Choose between sponsored and regular transaction
      if (useSponsorship && isEnabled) {
        // Use sponsored transaction
        mintHash = await sponsoredMint(
          oceansportAddress as string,
          account.address,
          tokenURI
        )
        
        toast.success(
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-400" size={16} />
            <span>Gas-free mint successful! 🎉</span>
          </div>,
          { duration: 6000 }
        )
      } else {
        // Use regular transaction
        mintHash = await writeContractAsync({
          abi: oceansportAbi,
          address: oceansportAddress as `0x${string}`,
          functionName: "safeMint",
          args: [account.address, tokenURI],
        })

        toast.success("NFT successfully minted! 🎉", { duration: 6000 })
      }

      // Wait for transaction receipt
      const receipt = await waitForTransactionReceipt(config, { hash: mintHash as `0x${string}` })
      setNftTx(receipt.transactionHash)

      // Show transaction link
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

      setTimeout(() => {
        router.push('/profile?tab=collected')
      }, 3000)

    } catch (err) {
      console.error("Minting failed:", err)
      toast.error("Could not mint NFT. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const isProcessing = isUploading || isSponsoring

  return (
    <ChainValidation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-blue-900 dark:to-teal-900">
        <NavBar items={navItems} />

        <section className="pt-24 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent mb-4">
                Create NFT
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Mint your ocean-inspired or sports-themed digital art and store it forever
              </p>
              {isEnabled && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-full">
                  <Zap className="text-yellow-600 dark:text-yellow-400" size={16} />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Gas-free minting available!
                  </span>
                </div>
              )}
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Upload Your Art</h3>
                  
                  {preview ? (
                    // Preview Mode
                    <div className="relative">
                      <NFTPreview preview={preview} onCroppedImage={handleCroppedImage} />
                      
                      {/* Status Indicator */}
                      {croppedFile && (
                        <div className="text-center mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                          ✓ Cropped version ready for minting
                        </div>
                      )}
                      
                      {/* Control Buttons */}
                      <div className="flex justify-center gap-2 mt-4">
                        <button
                          onClick={triggerFileSelect}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <Upload size={16} />
                          Change Image
                        </button>
                        <button
                          onClick={handleRemoveImage}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <X size={16} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Upload Mode
                    <div 
                      onClick={triggerFileSelect}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                    >
                      <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Drag and drop your file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500">Supports JPG, PNG, GIF, SVG, GLB, GLTF</p>
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">NFT Details</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ice cold Palmer"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="What makes this NFT special?"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Gas Sponsorship Toggle */}
                    {isEnabled && (
                      <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Zap className="text-yellow-600 dark:text-yellow-400" size={20} />
                            <div>
                              <h4 className="font-semibold text-gray-800 dark:text-white">Gas-Free Minting</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">We&apos;ll cover the gas fees for you!</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useSponsorship}
                              onChange={(e) => setUseSponsorship(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Success Message with Transaction Link */}
                    {nftTx && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle className="text-green-600" size={20} />
                          <span className="font-semibold text-green-800 dark:text-green-200">
                            NFT Minted Successfully!
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <a
                            href={`https://sepolia.basescan.org/tx/${nftTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            <ExternalLink size={16} />
                            View Transaction
                          </a>
                          <button
                            onClick={() => router.push('/profile?tab=created')}
                            className="flex items-center gap-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                          >
                            <User size={16} />
                            View in Profile
                          </button>
                        </div>
                      </motion.div>
                    )}

                    <div className="pt-6">
                      <button
                        onClick={handleMint}
                        disabled={isProcessing || !!nftTx}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            {isSponsoring ? "Sponsoring..." : "Uploading & Minting..."}
                          </>
                        ) : nftTx ? (
                          "NFT Minted!"
                        ) : (
                          <>
                            {useSponsorship && isEnabled && <Zap size={18} />}
                            {useSponsorship && isEnabled ? "Mint NFT (Gas-Free)" : "Mint NFT"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">💡 Pro Tips for Ocean & Sport-Themed NFTs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-600 dark:text-gray-400">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">🌊 Capture Motion & Emotion</h4>
                  <p>Showcase the energy of waves or the rush of sport. Movement and emotion grab attention.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">🏄‍♂️ Blend Sport with Nature</h4>
                  <p>Highlight activities like surfing, sailing, or beach football to resonate with ocean and sports lovers.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">🎯 Tell a Visual Story</h4>
                  <p>Build a narrative in your artwork — triumph, calm, adventure, or connection with the sea.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">🎨 High-Quality Visuals</h4>
                  <p>Use clear, sharp assets — 1080p minimum for images, 4K for video. Quality builds trust.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        
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
    </ChainValidation>
  )
}