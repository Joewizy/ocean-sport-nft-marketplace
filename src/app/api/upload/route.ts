import { NextResponse } from "next/server"
import { pinata } from "../../../../utils/config"

export async function POST(request: Request) {
  try {
    const { name, description, image } = await request.json()
    if (!name || !image) {
      return NextResponse.json({ error: "Missing name or image" }, { status: 400 })
    }

    // Pin the entire JSON object
    const { cid } = await pinata.upload.public.json({
      name,
      description,
      image,               // base64 data URL
    })

    if (!cid) {
      console.error("Pinata returned no CID")
      return NextResponse.json({ error: "Failed to upload metadata to IPFS" }, { status: 500 })
    }

    const tokenURI = await pinata.gateways.public.convert(cid)
    if (!tokenURI) {
    console.error("Pinata returned no tokenURI")
    return NextResponse.json({ error: "Failed to convert CID to tokenURI" }, { status: 500 })
  }
    return NextResponse.json({ tokenURI }, { status: 200 })
  } catch (error) {
    console.error("Pinata JSON upload error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
