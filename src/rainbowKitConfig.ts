"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { anvil, zksync, baseSepolia } from "viem/chains"

export default getDefaultConfig({
    appName: "OceanSport NFT Marketplace",
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID as string,
    chains: [anvil, zksync, baseSepolia],
    ssr: false
})
