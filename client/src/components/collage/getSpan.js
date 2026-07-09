// Pure function: (count, index) -> { col, row } span sizes for a bento-style
// mosaic grid with 4 columns. Beyond MAX_SPECIAL tiles, callers should fall
// back to a uniform grid (handled via a CSS class instead of inline spans).
export const MAX_SPECIAL = 8;

export function getSpan(count, index) {
  if (count === 1) return { col: 4, row: 3 };
  if (count === 2) return { col: 2, row: 3 };
  if (count === 3) return index === 0 ? { col: 2, row: 3 } : { col: 2, row: 2 };
  if (count === 4) return { col: 2, row: 2 };
  // 5-8: first tile is a "hero", rest are uniform small tiles
  return index === 0 ? { col: 2, row: 2 } : { col: 1, row: 1 };
}
