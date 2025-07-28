import { minimalForwarderAbi } from '@/contracts/constants'
import { ethers } from 'ethers'
import { TypedDataDomain, TypedDataField } from 'ethers'

interface MetaTxRequest {
  from: string
  to: string
  value: string
  gas: string
  nonce: string
  data: string
}

// EIP-712 Types for MinimalForwarder
const ForwardRequestTypes: Record<string, TypedDataField[]> = {
  ForwardRequest: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ],
}

class GasSponsorshipService {
  private provider: ethers.JsonRpcProvider
  private sponsorWallet: ethers.Wallet
  private forwarderAddress: string
  private forwarderContract: ethers.Contract
  private domain: TypedDataDomain

  constructor(
    rpcUrl: string,
    sponsorPrivateKey: string,
    forwarderAddress: string,
    chainId: number = 84532 // Base Sepolia
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.sponsorWallet = new ethers.Wallet(sponsorPrivateKey, this.provider)
    this.forwarderAddress = forwarderAddress

    const forwarderAbi = minimalForwarderAbi

    this.forwarderContract = new ethers.Contract(forwarderAddress, forwarderAbi, this.sponsorWallet)
    
    this.domain = {
      name: 'MinimalForwarder',
      version: '0.0.1',
      chainId,
      verifyingContract: forwarderAddress,
    }
  }

  /**
   * Sign a meta-transaction request using EIP-712
   */
  async signMetaTxRequest(signer: ethers.Signer, forwarder: string, input: Omit<MetaTxRequest, 'nonce'>): Promise<{ request: MetaTxRequest; signature: string }> {
    const from = await signer.getAddress()
    const nonce = await this.forwarderContract.getNonce(from)
    
    const request: MetaTxRequest = {
      ...input,
      from,
      nonce: nonce.toString()
    }

    // Sign using EIP-712
    const signature = await signer.signTypedData(this.domain, ForwardRequestTypes, request)
    
    return { request, signature }
  }

  /**
   * Execute sponsored transaction
   */
  async sponsorTransaction(request: MetaTxRequest, signature: string): Promise<ethers.ContractTransactionResponse> {
    // Verify the signature first
    const isValid = await this.forwarderContract.verify(request, signature)
    if (!isValid) {
      throw new Error('Invalid signature for meta-transaction')
    }

    // Execute the meta-transaction
    const tx = await this.forwarderContract.execute(request, signature, {
      gasLimit: 500000, 
    })

    return tx
  }

  /**
   * Estimate gas for a meta-transaction
   */
  async estimateGas(request: MetaTxRequest, signature: string): Promise<bigint> {
    return await this.forwarderContract.execute.estimateGas(request, signature)
  }
}

export { GasSponsorshipService, type MetaTxRequest }