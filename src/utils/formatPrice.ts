/**
 * Formats price values for consistent display across the application
 * @param price - The price value as a number (already converted from wei)
 * @param isUSDT - Whether the price is in USDT (true) or ETH (false)
 * @returns Formatted price string with currency symbol
 */
export const formatPrice = (price: number, isUSDT: boolean): string => {
  let formattedPrice: string
  
  if (isUSDT) {
    // For USDT, show up to 2 decimal places and remove trailing zeros
    formattedPrice = price.toFixed(2).replace(/\.?0+$/, '')
  } else {
    // For ETH, show up to 4 decimal places
    formattedPrice = price.toFixed(4)
  }
  
  return `${formattedPrice} ${isUSDT ? 'USDT' : 'ETH'}`
}

/**
 * Formats price from bigint (wei) to display string
 * @param priceWei - Price in wei as bigint
 * @param isUSDT - Whether the price is in USDT (true) or ETH (false)
 * @returns Formatted price string with currency symbol
 */
export const formatPriceFromWei = (priceWei: bigint, isUSDT: boolean): string => {
  const price = Number(priceWei) / 1e18
  return formatPrice(price, isUSDT)
}
