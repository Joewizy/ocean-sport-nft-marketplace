// pages/api/sponsor-transaction.ts (or app/api/sponsor-transaction/route.ts for App Router)
import { NextApiRequest, NextApiResponse } from 'next'
import { GasSponsorshipService } from '@/lib/gasSponsorship'

const gasService = new GasSponsorshipService(
  process.env.NEXT_PUBLIC_RPC_URL!,
  process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY!,
  process.env.NEXT_PUBLIC_FORWARDER_ADDRESS!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { request, signature } = req.body

    // Validate request structure
    if (!request || !signature) {
      return res.status(400).json({ error: 'Missing request or signature' })
    }

    // Optional: Add rate limiting or user verification here
    // Optional: Validate the request meets your sponsorship criteria

    // Execute the sponsored transaction
    const tx = await gasService.sponsorTransaction(request, signature)
    
    res.status(200).json({ 
      success: true, 
      txHash: tx.hash,
      message: 'Transaction sponsored successfully'
    })

  } catch (error) {
    console.error('Sponsorship error:', error)
    res.status(500).json({ 
      error: 'Failed to sponsor transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Alternative for App Router (app/api/sponsor-transaction/route.ts)
/*
import { NextRequest, NextResponse } from 'next/server'
import { GasSponsorshipService } from '@/lib/gasSponsorship'

const gasService = new GasSponsorshipService(
  process.env.NEXT_PUBLIC_RPC_URL!,
  process.env.SPONSOR_PRIVATE_KEY!,
  process.env.NEXT_PUBLIC_FORWARDER_ADDRESS!
)

export async function POST(request: NextRequest) {
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
*/