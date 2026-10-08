export interface Chunk {
  text: string;
  start: number;
  end: number;
}
export function clamp(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  return Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}
export function chunkText(text: string, width: number): Chunk[] {
  const size = Math.floor(clamp(width, 1, 20, 5));
  const segments = new Intl.Segmenter(undefined, {
    granularity: "grapheme",
  }).segment(text);
  const chunks: Chunk[] = [];
  let buffer = "",
    start = 0,
    count = 0;
  for (const item of segments) {
    if (!count) start = item.index;
    buffer += item.segment;
    if (++count === size) {
      chunks.push({
        text: buffer,
        start,
        end: item.index + item.segment.length,
      });
      buffer = "";
      count = 0;
    }
  }
  if (buffer) chunks.push({ text: buffer, start, end: text.length });
  return chunks;
}
export function indexAt(chunks: Chunk[], position: number): number {
  let low = 0,
    high = Math.max(0, chunks.length - 1);
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (chunks[mid].start <= position) low = mid;
    else high = mid - 1;
  }
  return low;
}
