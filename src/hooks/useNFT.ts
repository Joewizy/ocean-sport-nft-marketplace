"use client"

import { useState, useCallback } from 'react'
import { useConfig } from 'wagmi'
import { useAccount, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt, readContract } from '@wagmi/core'
import { oceansportAbi, oceansportAddress, nftMarketplaceAddress, usdtAbi, usdtAddress } from '@/contracts/constants'

export function useMarketplaceApproval() {
  const [isCheckingApproval, setIsCheckingApproval] = useState(false)
  const [isSettingApproval, setIsSettingApproval] = useState(false)
  const [approvalError, setApprovalError] = useState<string | null>(null)
  
  const config = useConfig()
  const account = useAccount()
  const { writeContractAsync } = useWriteContract()

  const setApproval = useCallback(async () => {
    if (!account.address) {
      setApprovalError('Wallet not connected')
      return false
    }

    setIsSettingApproval(true)
    setApprovalError(null)
    
    try {
      const approveMarketplaceHash = await writeContractAsync({
        abi: oceansportAbi,
        address: oceansportAddress as `0x${string}`,
        functionName: "setApprovalForAll",
        args: [nftMarketplaceAddress, true],
      })
      
      const approveMarketplaceReceipt = await waitForTransactionReceipt(config, { 
        hash: approveMarketplaceHash 
      })
      
      if (approveMarketplaceReceipt) {
        return true
      }
      return false
    } catch (error) {
      console.error('Error setting approval:', error)
      setApprovalError('Could not approve marketplace')
      return false
    } finally {
      setIsSettingApproval(false)
    }
  }, [account.address, config, writeContractAsync])

  const checkApproval = useCallback(async (): Promise<boolean> => {
    if (!account.address) {
      setApprovalError('Wallet not connected')
      return false
    }

    setIsCheckingApproval(true)
    setApprovalError(null)
    
    try {
      const response = await readContract(config, {
        abi: oceansportAbi,
        address: oceansportAddress as `0x${string}`,
        functionName: "isApprovedForAll",
        args: [account.address, nftMarketplaceAddress]
      })
      
      return response as boolean
    } catch (error) {
      console.error('Error checking approval:', error)
      setApprovalError(`Could not check if ${account.address} has approved OceanSport`)
      return false
    } finally {
      setIsCheckingApproval(false)
    }
  }, [account.address, config])

  const clearError = useCallback(() => {
    setApprovalError(null)
  }, [])

  return {
    setApproval,
    checkApproval,
    isCheckingApproval,
    isSettingApproval,
    approvalError,
    clearError,
    isLoading: isCheckingApproval || isSettingApproval
  }
}

export function useUSDTApproval() {
  const [isCheckingApproval, setIsCheckingApproval] = useState(false)
  const [isSettingApproval, setIsSettingApproval] = useState(false)
  const [approvalError, setApprovalError] = useState<string | null>(null)
  
  const config = useConfig()
  const account = useAccount()
  const { writeContractAsync } = useWriteContract()

  const setApproval = useCallback(async (amount: bigint) => {
    if (!account.address) {
      setApprovalError('Wallet not connected')
      return false
    }

    setIsSettingApproval(true)
    setApprovalError(null)
    
    try {
      const approveUSDTHash = await writeContractAsync({
        abi: usdtAbi,
        address: usdtAddress as `0x${string}`,
        functionName: "approve",
        args: [nftMarketplaceAddress, amount],
      })
      
      const approveUSDTReceipt = await waitForTransactionReceipt(config, { 
        hash: approveUSDTHash 
      })
      
      if (approveUSDTReceipt) {
        return true
      }
      return false
    } catch (error) {
      console.error('Error setting USDT approval:', error)
      setApprovalError('Could not approve USDT spending')
      return false
    } finally {
      setIsSettingApproval(false)
    }
  }, [account.address, config, writeContractAsync])

  const checkApproval = useCallback(async (amount: bigint): Promise<boolean> => {
    if (!account.address) {
      setApprovalError('Wallet not connected')
      return false
    }

    setIsCheckingApproval(true)
    setApprovalError(null)
    
    try {
      const allowance = await readContract(config, {
        abi: usdtAbi,
        address: usdtAddress as `0x${string}`,
        functionName: "allowance",
        args: [account.address, nftMarketplaceAddress]
      })
      
      return (allowance as bigint) >= amount
    } catch (error) {
      console.error('Error checking USDT allowance:', error)
      setApprovalError(`Could not check USDT allowance for ${account.address}`)
      return false
    } finally {
      setIsCheckingApproval(false)
    }
  }, [account.address, config])

  const clearError = useCallback(() => {
    setApprovalError(null)
  }, [])

  return {
    setApproval,
    checkApproval,
    isCheckingApproval,
    isSettingApproval,
    approvalError,
    clearError,
    isLoading: isCheckingApproval || isSettingApproval
  }
}
