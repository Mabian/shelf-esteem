import { Book } from '../goodreads.service';

export interface YearGroup {
  year: number;
  books: Book[];
}

export function groupByYear(books: Book[]): YearGroup[] {
  const groups: YearGroup[] = [];
  for (const book of [...books].sort((a, b) => b.read.getTime() - a.read.getTime())) {
    const year = book.read.getFullYear();
    const group = groups.at(-1);
    if (group?.year === year) {
      group.books.push(book);
    } else {
      groups.push({ year, books: [book] });
    }
  }
  return groups;
}
