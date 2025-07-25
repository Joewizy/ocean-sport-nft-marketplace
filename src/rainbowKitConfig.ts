"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { monadTestnet, zksync, baseSepolia, polygonZkEvmTestnet , avalanche} from "viem/chains"

export default getDefaultConfig({
    appName: "OceanSport NFT Marketplace",
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID as string,
    chains: [monadTestnet, zksync, baseSepolia, polygonZkEvmTestnet, avalanche],
    ssr: false
})
