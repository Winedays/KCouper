/**
 * Resolve a manually typed price into a valid [min, max] range.
 * Returns null when the text is empty or not a number (caller should revert).
 */
export function resolvePriceInput(
  text: string,
  current: [number, number],
  side: "min" | "max",
  stats: { min: number; max: number }
): [number, number] | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return null;

  let value = Math.min(Math.max(Math.round(parsed), stats.min), stats.max);

  if (side === "min") {
    value = Math.min(value, current[1]);
    return [value, current[1]];
  }
  value = Math.max(value, current[0]);
  return [current[0], value];
}
