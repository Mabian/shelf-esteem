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
