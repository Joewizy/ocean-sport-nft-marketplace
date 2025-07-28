import { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { ethers } from 'ethers'
import { GasSponsorshipService } from '@/lib/gasSponsorship'
import { minimalForwarderAddress } from '@/contracts/constants'

// Environment variables
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!
const NEXT_PUBLIC_SPONSOR_PRIVATE_KEY = process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY!
const FORWARDER_ADDRESS = minimalForwarderAddress 
const GAS_SPONSORSHIP_ENABLED = process.env.NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED === 'true'

if (!NEXT_PUBLIC_SPONSOR_PRIVATE_KEY || NEXT_PUBLIC_SPONSOR_PRIVATE_KEY.length < 64) {
  throw new Error('Invalid or missing NEXT_PUBLIC_SPONSOR_PRIVATE_KEY in env')
}

const gasService = new GasSponsorshipService(
  RPC_URL,
  NEXT_PUBLIC_SPONSOR_PRIVATE_KEY,
  FORWARDER_ADDRESS
)

export function useGasSponsorship() {
  const [isSponsoring, setIsSponsoring] = useState(false)
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()

  /**
   * Execute a sponsored transaction
   */
  const sponsorTransaction = async (
    contractAddress: string,
    calldata: string,
    value: string = '0'
  ): Promise<string> => {
    if (!GAS_SPONSORSHIP_ENABLED) {
      throw new Error('Gas sponsorship is not enabled')
    }

    if (!address || !walletClient) {
      throw new Error('Wallet not connected')
    }

    setIsSponsoring(true)

    try {
      // Convert wallet client to ethers signer
      const provider = new ethers.BrowserProvider(walletClient.transport)
      const signer = await provider.getSigner()

      // Prepare meta-transaction request
      const requestData = {
        from: address,
        to: contractAddress,
        value,
        gas: '500000', // Adjust based on your needs
        data: calldata,
      }

      // Sign the meta-transaction
      const { request, signature } = await gasService.signMetaTxRequest(
        signer,
        FORWARDER_ADDRESS,
        requestData
      )

      // Execute sponsored transaction
      const tx = await gasService.sponsorTransaction(request, signature)

      return tx.hash
    } catch (error) {
      console.error('Sponsored transaction failed:', error)
      throw error
    } finally {
      setIsSponsoring(false)
    }
  }

  return {
    sponsorTransaction,
    isSponsoring,
    isEnabled: GAS_SPONSORSHIP_ENABLED
  }
}

// Hook for NFT operations with gas sponsorship
export function useNFTOperations() {
  const { sponsorTransaction, isSponsoring, isEnabled } = useGasSponsorship()

  /**
   * Mint NFT with gas sponsorship
   */
  const sponsoredMint = async (
    nftContractAddress: string,
    to: string,
    tokenURI: string
  ) => {
    // Encode the safeMint function call
    const iface = new ethers.Interface([
      'function safeMint(address to, string uri) returns (uint256)'
    ])
    const calldata = iface.encodeFunctionData('safeMint', [to, tokenURI])

    return await sponsorTransaction(nftContractAddress, calldata)
  }

  /**
   * List NFT with gas sponsorship
   */
  const sponsoredListNFT = async (
    marketplaceAddress: string,
    nftContract: string,
    tokenId: string,
    price: string,
    isUSDT: boolean
  ) => {
    const iface = new ethers.Interface([
      'function listNFT(address nftContract, uint256 tokenId, uint256 price, bool isUSDT)'
    ])
    const calldata = iface.encodeFunctionData('listNFT', [nftContract, tokenId, price, isUSDT])

    return await sponsorTransaction(marketplaceAddress, calldata)
  }

  /**
   * Buy NFT with gas sponsorship (ETH only - USDT requires different handling)
   */
  const sponsoredBuyNFT = async (
    marketplaceAddress: string,
    listingId: string,
    price: string
  ) => {
    const iface = new ethers.Interface([
      'function buyNFT(uint256 listingId)'
    ])
    const calldata = iface.encodeFunctionData('buyNFT', [listingId])

    return await sponsorTransaction(marketplaceAddress, calldata, price)
  }

  /**
   * Create auction with gas sponsorship
   */
  const sponsoredCreateAuction = async (
    marketplaceAddress: string,
    nftContract: string,
    tokenId: string,
    startingPrice: string,
    duration: string,
    isUSDT: boolean
  ) => {
    const iface = new ethers.Interface([
      'function createAuction(address nftContract, uint256 tokenId, uint256 startingPrice, uint256 duration, bool isUSDT)'
    ])
    const calldata = iface.encodeFunctionData('createAuction', [
      nftContract,
      tokenId,
      startingPrice,
      duration,
      isUSDT
    ])

    return await sponsorTransaction(marketplaceAddress, calldata)
  }

  /**
   * Place bid with gas sponsorship (ETH only)
   */
  const sponsoredPlaceBid = async (
    marketplaceAddress: string,
    auctionId: string,
    bidAmount: string
  ) => {
    const iface = new ethers.Interface([
      'function placeBid(uint256 auctionId, uint256 bidAmount)'
    ])
    const calldata = iface.encodeFunctionData('placeBid', [auctionId, '0']) // bidAmount is 0 for ETH auctions

    return await sponsorTransaction(marketplaceAddress, calldata, bidAmount)
  }

  /**
   * End auction with gas sponsorship
   */
  const sponsoredEndAuction = async (
    marketplaceAddress: string,
    auctionId: string
  ) => {
    const iface = new ethers.Interface([
      'function endAuction(uint256 auctionId)'
    ])
    const calldata = iface.encodeFunctionData('endAuction', [auctionId])

    return await sponsorTransaction(marketplaceAddress, calldata)
  }

  return {
    sponsoredMint,
    sponsoredListNFT,
    sponsoredBuyNFT,
    sponsoredCreateAuction,
    sponsoredPlaceBid,
    sponsoredEndAuction,
    isSponsoring,
    isEnabled
  }
}