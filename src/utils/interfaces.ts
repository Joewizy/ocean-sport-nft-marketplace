export interface FetchedNFTs {
    id: string,
    title: string,
    image: string,
    description: string,
    price: number,
    likes: number,
    views: number,
}

export interface NFTForModal {
  id: number
  title: string
  image: string
  currentPrice?: string
}

export interface NFTPreviewProps {
  preview: string | null
}