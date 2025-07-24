"use client"

import Image from "next/image"
import { Home, ShoppingBag, Plus, User, Upload, Palette, Camera } from "lucide-react"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { motion } from "framer-motion"
import { useState } from "react"

export default function CreatePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Marketplace', url: '/marketplace', icon: ShoppingBag },
    { name: 'Create', url: '/create', icon: Plus },
    { name: 'Profile', url: '/profile', icon: User },
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-blue-900 dark:to-teal-900">
      <NavBar items={navItems} />
      
      {/* Header */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
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
              Mint your ocean-inspired digital art and share it with the world
            </p>
          </motion.div>

          {/* Creation Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Upload Your Art</h3>
                
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
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
                    <div>
                      <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Drag and drop your file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports JPG, PNG, GIF, SVG, MP4, WEBM, MP3, WAV, OGG, GLB, GLTF
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,video/*,audio/*,.glb,.gltf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {/* Quick Templates */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Templates</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <button className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Camera className="mb-2 text-blue-600" size={24} />
                      <span className="text-sm">Photo</span>
                    </button>
                    <button className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Palette className="mb-2 text-cyan-600" size={24} />
                      <span className="text-sm">Digital Art</span>
                    </button>
                    <button className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Plus className="mb-2 text-teal-600" size={24} />
                      <span className="text-sm">3D Model</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">NFT Details</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Ocean Waves #001"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe your NFT... What makes it special? What story does it tell?"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select a category</option>
                      <option value="photography">Photography</option>
                      <option value="digital-art">Digital Art</option>
                      <option value="3d-art">3D Art</option>
                      <option value="animation">Animation</option>
                      <option value="music">Music</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price (ETH)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="2.5"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Royalties (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        placeholder="10"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      placeholder="ocean, waves, blue, nature (separate with commas)"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                      Mint NFT
                    </button>
                    <button className="flex-1 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300">
                      Save Draft
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">💡 Pro Tips for Ocean-Themed NFTs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-600 dark:text-gray-400">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">🌊 Capture the Essence</h4>
                <p>Focus on the movement, colors, and emotions that the ocean evokes. Whether it's the tranquility of calm waters or the power of crashing waves.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">🐠 Tell a Story</h4>
                <p>Every piece should narrate something about marine life, conservation, or the relationship between humans and the sea.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">🎨 Quality Matters</h4>
                <p>High-resolution images and well-crafted digital art perform better. Aim for at least 1080p for images and 4K for videos.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">🏷️ Smart Pricing</h4>
                <p>Research similar NFTs in the ocean/nature category. Start competitive and build your reputation in the community.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
