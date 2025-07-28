"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { baseSepolia, avalanche, somniaTestnet} from "viem/chains"

export default getDefaultConfig({
    appName: "OceanSport NFT Marketplace",
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID as string,
    chains: [somniaTestnet, avalanche, baseSepolia],
    ssr: false
})
