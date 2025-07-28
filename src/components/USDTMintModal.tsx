"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Coins, DollarSign } from "lucide-react"
import { useAccount, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from "@wagmi/core"
import { useConfig } from "wagmi"
import toast from "react-hot-toast"
import { usdtAbi, usdtAddress } from "@/contracts/constants"

interface USDTMintModalProps {
  isOpen: boolean
  onClose: () => void
}

export function USDTMintModal({ isOpen, onClose }: USDTMintModalProps) {
  const [amount, setAmount] = useState('100')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const account = useAccount()
  const { writeContractAsync } = useWriteContract()
  const config = useConfig()

  const clearError = () => setError('')

  const handleMint = async () => {
    if (!account.address) {
      setError("Please connect your wallet")
      return
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setIsProcessing(true)
    clearError()

    try {
      const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18))

      const txHash = await writeContractAsync({
        abi: usdtAbi,
        address: usdtAddress as `0x${string}`,
        functionName: "mint",
        args: [account.address, amountInWei],
      })

      const receipt = await waitForTransactionReceipt(config, { hash: txHash })
      
      if (receipt) {
        toast.success(
          <div className="flex flex-col gap-2">
            <span>USDT minted successfully! 🎉</span>
            <span className="text-sm opacity-80">You can now use USDT for purchases and bids</span>
          </div>,
          { duration: 5000 }
        )
        onClose()
      }
    } catch (err) {
      console.error('USDT minting failed:', err)
      setError('Failed to mint USDT. Please try again.')
      toast.error('Failed to mint USDT. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <DollarSign className="text-green-600" size={24} />
                Mint Test USDT
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Coins className="text-blue-600 dark:text-blue-400" size={20} />
                  <div>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200">Test Environment</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      This is a test USDT token. You can mint any amount for testing purposes.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount to Mint (USDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isProcessing}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 100-1000 USDT for testing
                </p>
              </div>
              
              {/* Action Button */}
              <button
                onClick={handleMint}
                disabled={!amount || isProcessing}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Minting USDT...
                  </div>
                ) : (
                  `Mint ${amount} USDT`
                )}
              </button>
              
              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 