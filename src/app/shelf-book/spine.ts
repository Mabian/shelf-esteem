export const SPINE_STYLES = ['serif', 'classic', 'condensed', 'display', 'sans'] as const;
export type SpineStyle = (typeof SPINE_STYLES)[number];

/** A stable number in [0, 1) per text, so every book looks the same on every visit. */
export function hash(text: string): number {
  let h = 2166136261;
  for (const char of text) {
    h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** Thicker books get thicker spines. Books without a page count look like a typical novel. */
export function spineWidth(pages: number): number {
  return Math.round(Math.min(48, Math.max(18, 12 + (pages || 350) / 32)));
}

export function spineHeight(bookId: string): number {
  return Math.round(122 + hash(bookId) * 32);
}

export function spineStyle(bookId: string): SpineStyle {
  return SPINE_STYLES[Math.floor(hash(`${bookId}type`) * SPINE_STYLES.length)];
}

/** Drops subtitles, which never fit on a spine anyway. */
export function spineTitle(title: string): string {
  return title.replace(/\s*[:(].*$/, '');
}

/** Only thick spines have room for the author, and only when the title stays whole. */
export function showsAuthor(width: number, title: string, surname: string): boolean {
  return width >= 30 && title.length + surname.length <= 16;
}
