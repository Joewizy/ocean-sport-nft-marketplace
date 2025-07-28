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

export interface LiveAuction {
  id: number;
  title: string;
  image: string;
  description: string;
  artist: string;
  currentBid: string;
  startingPrice: string; 
  bidCount: number;
  timeLeft: string;
  endTime: number;
  hasBids: boolean; 
  currentBidUSD?: string; 
  bidHistory?: { bidder: string; amount: string; time: string }[]; 
}

export interface ListNFTModalProps {
  isOpen: boolean
  onClose: () => void
  nft: {
    id: number
    title: string
    image: string
    currentPrice?: string
  }
}