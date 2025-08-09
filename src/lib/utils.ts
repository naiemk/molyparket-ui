import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a contract value (wei) to human-readable decimal price
 * @param weiValue - The value returned from the contract in wei
 * @param decimals - Number of decimal places to format (default: 6)
 * @returns Formatted decimal string
 */
export function weiToDecimal(weiValue: bigint | string | number): string {
  if (!weiValue) {
    return '0.00'
  }
  const DECIMALS_NORMALIZER = BigInt(10 ** 18)
  const value = BigInt(weiValue)
  const humanReadablePrice = Number(value) / Number(DECIMALS_NORMALIZER)
  return humanReadablePrice.toFixed(2)
}

/**
 * Converts a contract value (wei) to human-readable decimal number
 * @param weiValue - The value returned from the contract in wei
 * @returns Decimal number
 */
export function weiToDecimalNumber(weiValue: bigint | string | number): number {
  if (!weiValue) {
    return 0
  }
  const DECIMALS_NORMALIZER = BigInt(10 ** 18)
  const value = BigInt(weiValue)
  return Number(value) / Number(DECIMALS_NORMALIZER)
}
