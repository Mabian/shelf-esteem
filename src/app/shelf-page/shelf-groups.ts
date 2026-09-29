import { Rgb } from '../cover-color.service';
import { Book } from '../goodreads.service';
import { surname } from '../shelf-book/spine';

export interface ShelfGroup {
  label: string;
  books: Book[];
}

export function groupByYear(books: Book[]): ShelfGroup[] {
  const sorted = [...books].sort((a, b) => b.read.getTime() - a.read.getTime());
  return groupBy(sorted, (book) => String(book.read.getFullYear()));
}

const collator = new Intl.Collator('en', { sensitivity: 'base' });

/** By surname, then title. Only letters some author actually starts with get a group. */
export function groupByAuthor(books: Book[]): ShelfGroup[] {
  const sorted = [...books].sort(
    (a, b) =>
      collator.compare(surname(a.author), surname(b.author)) ||
      collator.compare(a.author, b.author) ||
      collator.compare(a.title, b.title),
  );
  return groupBy(sorted, (book) => initial(surname(book.author)));
}

// Accents fold into their base letter, so Kenzaburō Ōe files under O like in a library
function initial(name: string): string {
  const letter = name.normalize('NFD').charAt(0).toUpperCase();
  return /\p{L}/u.test(letter) ? letter : '#';
}

/**
 * One unlabeled group running through the hues like a rainbow. Grays have no meaningful hue, so
 * they follow from light to dark, and books without a known color come last.
 */
export function groupByColor(books: Book[], colors: Map<string, Rgb>): ShelfGroup[] {
  const key = (book: Book): [number, number] => {
    const color = colors.get(book.id);
    if (!color) {
      return [2, 0];
    }
    const [r, g, b] = color;
    const max = Math.max(r, g, b);
    const chroma = max - Math.min(r, g, b);
    if (chroma < GRAY_CHROMA) {
      return [1, -(r + g + b)];
    }
    const hue =
      max === r
        ? ((g - b) / chroma + 6) % 6
        : max === g
          ? (b - r) / chroma + 2
          : (r - g) / chroma + 4;
    return [0, hue];
  };
  const keyed = books.map((book) => ({ book, key: key(book) }));
  keyed.sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1]);
  return books.length ? [{ label: '', books: keyed.map(({ book }) => book) }] : [];
}

// Below this spread between the strongest and weakest channel, a color reads as gray
const GRAY_CHROMA = 40;

function groupBy(sorted: Book[], labelOf: (book: Book) => string): ShelfGroup[] {
  const groups: ShelfGroup[] = [];
  for (const book of sorted) {
    const label = labelOf(book);
    const group = groups.at(-1);
    if (group?.label === label) {
      group.books.push(book);
    } else {
      groups.push({ label, books: [book] });
    }
  }
  return groups;
}
