import { NextRequest, NextResponse } from 'next/server'
import { GasSponsorshipService } from '@/lib/gasSponsorship'

// Check if required environment variables are available
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL
const SPONSOR_PRIVATE_KEY = process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY
const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS

// Only create the service if all required env vars are present
const gasService = RPC_URL && SPONSOR_PRIVATE_KEY && FORWARDER_ADDRESS 
  ? new GasSponsorshipService(RPC_URL, SPONSOR_PRIVATE_KEY, FORWARDER_ADDRESS)
  : null

export async function POST(request: NextRequest) {
  // Check if gas sponsorship is properly configured
  if (!gasService) {
    return NextResponse.json({ 
      error: 'Gas sponsorship not configured',
      details: 'Missing required environment variables'
    }, { status: 500 })
  }

  try {
    const { request: metaTxRequest, signature } = await request.json()

    if (!metaTxRequest || !signature) {
      return NextResponse.json({ error: 'Missing request or signature' }, { status: 400 })
    }

    const tx = await gasService.sponsorTransaction(metaTxRequest, signature)
    
    return NextResponse.json({ 
      success: true, 
      txHash: tx.hash,
      message: 'Transaction sponsored successfully'
    })

  } catch (error) {
    console.error('Sponsorship error:', error)
    return NextResponse.json({ 
      error: 'Failed to sponsor transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}