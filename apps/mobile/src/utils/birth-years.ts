/** Birth years offered for a CP → 3e child (ages 5 to 16), most recent first. */
export function plausibleBirthYears(currentYear: number): number[] {
  return Array.from({ length: 12 }, (_, index) => currentYear - 5 - index);
}
