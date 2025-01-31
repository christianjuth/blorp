export function abbriviateNumber(number: number): string {
  if (number < 1000) {
    return String(number);
  }

  if (number < 1000000) {
    return `${Math.floor(number / 100) / 10}k`;
  }

  return `${Math.floor(number / 100000) / 10}m`;
}
