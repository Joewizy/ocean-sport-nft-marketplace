"use client"

import { useAccount, useConfig, useSwitchChain } from "wagmi"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle, ExternalLink, X } from "lucide-react"
import { baseSepolia } from "viem/chains"
import { useState, useEffect } from "react"

interface ChainValidationProps {
  children: React.ReactNode
}

export function ChainValidation({ children }: ChainValidationProps) {
  const account = useAccount()
  const config = useConfig()
  const { switchChain } = useSwitchChain()
  const [isDismissed, setIsDismissed] = useState(false)
  const [hasShownCorrectNetwork, setHasShownCorrectNetwork] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  const currentChain = config.chains.find(chain => chain.id === account.chainId)
  const isCorrectChain = account.chainId === baseSepolia.id
  const isConnected = account.isConnected

  // Load dismiss state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('chain-validation-dismissed')
      if (dismissed === 'true') {
        setIsDismissed(true)
      }
      setIsLoaded(true)
    }
  }, [])

  // Track when user switches to correct network
  useEffect(() => {
    if (isConnected && isCorrectChain && !hasShownCorrectNetwork && isLoaded) {
      setHasShownCorrectNetwork(true)
      // Show the success notification for 5 seconds then auto-dismiss
      setTimeout(() => {
        setIsDismissed(true)
        if (typeof window !== 'undefined') {
          localStorage.setItem('chain-validation-dismissed', 'true')
        }
      }, 5000)
    }
  }, [isConnected, isCorrectChain, hasShownCorrectNetwork, isLoaded])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('chain-validation-dismissed', 'true')
    }
  }

  // Don't show anything until we've loaded the localStorage state
  if (!isLoaded) {
    return <>{children}</>
  }

  if (!isConnected || isDismissed) {
    return <>{children}</>
  }

  if (!isCorrectChain) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg max-w-md"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={16} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                    Wrong Network
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    You're connected to {currentChain?.name || 'Unknown Network'}. Please switch to Base Sepolia.
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded-full transition-colors"
                >
                  <X size={14} className="text-red-600 dark:text-red-400" />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => switchChain({ chainId: baseSepolia.id })}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  Switch to Base Sepolia
                </button>
                <a
                  href="https://docs.base.org/guides/deploy-smart-contracts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400 text-xs flex items-center gap-1 hover:underline"
                >
                  Learn More <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
        {children}
      </>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 shadow-lg max-w-md"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600 dark:text-green-400" size={16} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Connected to Base Sepolia
                </h3>
                <p className="text-sm text-green-600 dark:text-green-300">
                  You're on the correct network. Ready to trade! 🚀
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="ml-2 p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded-full transition-colors"
              >
                <X size={14} className="text-green-600 dark:text-green-400" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      {children}
    </>
  )
} 