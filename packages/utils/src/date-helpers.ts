export function calculateRentalDays(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
}

export function isLongTermRental(start: Date, end: Date): boolean {
  return calculateRentalDays(start, end) > 7;
}
