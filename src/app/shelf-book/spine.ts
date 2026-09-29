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

export interface SpineLettering {
  style: SpineStyle;
  fontSize: number;
  lines: 1 | 2;
  showsAuthor: boolean;
}

// Average character width in em, measured with real titles (letter spacing and capitals included)
const CHAR_WIDTH: Record<SpineStyle, number> = {
  serif: 0.52,
  classic: 0.8,
  condensed: 0.52,
  display: 0.41,
  sans: 0.54,
};
// Single titles run up to ~6% wider than the average
const WIDTH_MARGIN = 1.06;
const MAX_FONT_SIZE: Record<SpineStyle, number> = {
  serif: 13,
  classic: 10.5,
  condensed: 13,
  display: 17,
  sans: 11.5,
};
// Smaller than this is unreadable on the shelf; longer titles still end in "…".
// Bebas Neue turns mushy well before the others do.
const MIN_FONT_SIZE: Record<SpineStyle, number> = {
  serif: 9,
  classic: 9,
  condensed: 9,
  display: 13,
  sans: 9,
};
const SPINE_PADDING = 26;
const AUTHOR_CHAR_WIDTH = 6.5;
const AUTHOR_GAP = 8;
// Narrowest first, Oswald goes before the equally narrow Playfair because it stays crisp when small
const FALLBACK_ORDER: SpineStyle[] = ['display', 'condensed', 'serif', 'sans', 'classic'];

export function surname(author: string): string {
  return author.split(' ').pop() ?? '';
}

/**
 * Sizes the title to fit the spine, like real books do: long titles get smaller letters, thick
 * spines may break the title onto a second line, and a title too long for the book's own
 * lettering switches to a narrower one.
 */
export function spineLettering(
  style: SpineStyle,
  title: string,
  surname: string,
  width: number,
  height: number,
): SpineLettering {
  const preferred = fit(style, title, surname, width, height);
  if (preferred.fits) {
    return preferred.lettering;
  }
  const narrower = FALLBACK_ORDER.map((s) => fit(s, title, surname, width, height));
  const fitting = narrower.find((candidate) => candidate.fits);
  if (fitting) {
    return fitting.lettering;
  }
  // Nothing fits whole: take the lettering that cuts off the least
  return narrower.reduce((a, b) => (b.shown > a.shown ? b : a)).lettering;
}

function fit(
  style: SpineStyle,
  title: string,
  surname: string,
  width: number,
  height: number,
): { lettering: SpineLettering; fits: boolean; shown: number } {
  const maxSize = MAX_FONT_SIZE[style];
  const titleEms = title.length * CHAR_WIDTH[style] * WIDTH_MARGIN;
  const length = height - SPINE_PADDING;
  const authorLength = surname.length * AUTHOR_CHAR_WIDTH + AUTHOR_GAP;

  // The author only goes on thick spines where the title still fits whole at full size
  const showsAuthor = width >= 30 && titleEms * maxSize <= length - authorLength;
  const titleLength = showsAuthor ? length - authorLength : length;

  // Capitals fill almost the whole line box, so a line may take at most ~72% of the spine width
  const oneLine = Math.min(maxSize, titleLength / titleEms, width * 0.72);
  // Word wrapping never fills both lines completely, hence 1.8 instead of 2
  const twoLines =
    width >= 30 ? Math.min(maxSize, (1.8 * titleLength) / titleEms, (width * 0.8) / 2) : 0;

  const lines = twoLines > oneLine ? 2 : 1;
  const size = lines === 2 ? twoLines : oneLine;
  const minSize = MIN_FONT_SIZE[style];
  return {
    // Rounded down, so the limits above are never exceeded
    lettering: {
      style,
      fontSize: Math.floor(Math.max(minSize, size) * 10) / 10,
      lines,
      showsAuthor,
    },
    fits: size >= minSize,
    // Roughly the share of the title that stays visible at the minimum size
    shown: size / minSize,
  };
}
