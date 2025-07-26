"use client"

import Image from "next/image"
import { Home, ShoppingBag, Plus, User, Upload, Palette, Camera, Gavel } from "lucide-react"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { motion } from "framer-motion"
import { useState } from "react"
import { useAccount, useConfig, useWriteContract } from "wagmi"
import { oceansportAbi, oceansportAddress } from "@/contracts/constants"
import { waitForTransactionReceipt } from "@wagmi/core"

export default function CreatePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [nftTx, setNftTx] = useState<string | `0x${string}`>()

  const account = useAccount()
  const config = useConfig()
  const { writeContractAsync } = useWriteContract()
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

  async function handleMint() {
    if (!name || !selectedFile) {
      alert("Please enter a name and upload a file.")
      return
    }

    try {
      setIsUploading(true)
      // Convert file to base64 Data URL to pass in JSON
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      // Upload metadata to IPFS
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, image: base64Image }),
      })
      const { tokenURI } = await response.json()
            
      const mintHash = await writeContractAsync({
        abi: oceansportAbi,
        address: oceansportAddress as `0x${string}`,
        functionName: "safeMint",
        args: [account.address, tokenURI],
      })

      const receipt = await waitForTransactionReceipt(config, { hash: mintHash })
      setNftTx(receipt.transactionHash)
      alert("NFT successfully minted!")
    } catch (err) {
      console.error("Minting failed:", err)
      alert("Could not mint NFT")
    } finally {
      setIsUploading(false)
    }
  }

  return (
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
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors relative">
                  {preview ? (
                    <div className="relative aspect-square max-w-sm mx-auto">
                      <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Drag and drop your file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500">Supports JPG, PNG, GIF, SVG, GLB, GLTF</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*,.glb,.gltf"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
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

                  <div className="pt-6">
                    <button
                      onClick={handleMint}
                      disabled={isUploading}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      {isUploading ? "Uploading & Minting..." : "Mint NFT"}
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
    </div>
  )
}
