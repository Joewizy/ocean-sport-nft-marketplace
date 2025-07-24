"use client"

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'

// Mock NFT Contract ABI (you'll need to replace with your actual contract ABI)
const NFT_CONTRACT_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' }
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }]
  },
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' }
    ]
  }
] as const

const MARKETPLACE_CONTRACT_ABI = [
  {
    name: 'listItem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftAddress', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' }
    ]
  },
  {
    name: 'buyItem',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'nftAddress', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ]
  },
  {
    name: 'createAuction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftAddress', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'startingPrice', type: 'uint256' },
      { name: 'duration', type: 'uint256' }
    ]
  },
  {
    name: 'placeBid',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'auctionId', type: 'uint256' }
    ]
  }
] as const

// Contract addresses (replace with your deployed contract addresses)
const NFT_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890' as const
const MARKETPLACE_CONTRACT_ADDRESS = '0x0987654321098765432109876543210987654321' as const

export function useNFTMinting() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const mintNFT = async (metadata: {
    name: string
    description: string
    image: string
    attributes: Array<{ trait_type: string; value: string }>
  }) => {
    if (!address) {
      setError('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // In a real implementation, you would upload metadata to IPFS
      // For now, we'll simulate with a mock URI
      const tokenURI = `ipfs://mock-hash/${Date.now()}`

      writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_CONTRACT_ABI,
        functionName: 'mint',
        args: [address, tokenURI],
        value: parseEther('0.01') // Minting fee
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mint NFT')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    mintNFT,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    error,
    hash
  }
}

export function useNFTListing() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const listNFT = async (tokenId: number, price: string) => {
    if (!address) {
      setError('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // First approve the marketplace to transfer the NFT
      writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_CONTRACT_ABI,
        functionName: 'setApprovalForAll',
        args: [MARKETPLACE_CONTRACT_ADDRESS, true]
      })

      // Then list the item (in real implementation, this would be a separate transaction)
      // writeContract({
      //   address: MARKETPLACE_CONTRACT_ADDRESS,
      //   abi: MARKETPLACE_CONTRACT_ABI,
      //   functionName: 'listItem',
      //   args: [NFT_CONTRACT_ADDRESS, BigInt(tokenId), parseEther(price)]
      // })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list NFT')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    listNFT,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    error,
    hash
  }
}

export function useNFTPurchase() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const buyNFT = async (tokenId: number, price: string) => {
    if (!address) {
      setError('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      writeContract({
        address: MARKETPLACE_CONTRACT_ADDRESS,
        abi: MARKETPLACE_CONTRACT_ABI,
        functionName: 'buyItem',
        args: [NFT_CONTRACT_ADDRESS, BigInt(tokenId)],
        value: parseEther(price)
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purchase NFT')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    buyNFT,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    error,
    hash
  }
}

export function useNFTAuction() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const createAuction = async (tokenId: number, startingPrice: string, duration: number) => {
    if (!address) {
      setError('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      writeContract({
        address: MARKETPLACE_CONTRACT_ADDRESS,
        abi: MARKETPLACE_CONTRACT_ABI,
        functionName: 'createAuction',
        args: [NFT_CONTRACT_ADDRESS, BigInt(tokenId), parseEther(startingPrice), BigInt(duration)]
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create auction')
    } finally {
      setIsLoading(false)
    }
  }

  const placeBid = async (auctionId: number, bidAmount: string) => {
    if (!address) {
      setError('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      writeContract({
        address: MARKETPLACE_CONTRACT_ADDRESS,
        abi: MARKETPLACE_CONTRACT_ABI,
        functionName: 'placeBid',
        args: [BigInt(auctionId)],
        value: parseEther(bidAmount)
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createAuction,
    placeBid,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    error,
    hash
  }
}
