/**
 * Abbriviate number counts
 *
 * @example
 *   abbriviateNumber(1000) // "1k"
 *   abbriviateNumber(1000000) // "1m"
 */
export function abbriviateNumber(number: number): string {
  if (number < 1000) {
    return String(number);
  }

  if (number < 1000000) {
    return `${Math.floor(number / 100) / 10}k`;
  }

  return `${Math.floor(number / 100000) / 10}m`;
}
