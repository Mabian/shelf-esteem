import { Book } from '../goodreads.service';

const DAY = 24 * 60 * 60 * 1000;
// Paper is roughly 0.1 mm thick, and each sheet carries two pages
const METERS_PER_PAGE = 0.00005;
const LENGTHS = [
  { label: 'Under 200', max: 200 },
  { label: '200–399', max: 400 },
  { label: '400–599', max: 600 },
  { label: '600+', max: Infinity },
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface Count {
  label: string;
  count: number;
}

export interface YearStats {
  year: number;
  books: number;
  pages: number;
  averageRating?: number;
}

export interface ShelfStats {
  books: number;
  pages: number;
  years: YearStats[];
  booksPerYear: number;
  recordYear?: YearStats;
  months: Count[];
  busiestMonth?: Count;
  longestGap?: { days: number; before: Book; after: Book };
  longestStreak?: { months: number; start: Date; end: Date };
  pagesPerDay: number;
  pagesPerDayThisYear: number;
  booksThisYear: number;
  projectedThisYear: number;

  averagePages?: number;
  medianPages?: number;
  longest?: Book;
  shortest?: Book;
  lengths: (Count & { averageRating?: number })[];
  stackMeters: number;

  averageRating?: number;
  ratings: Count[];
  unrated: number;
  ratingVsCrowd?: number;
  lovedMoreThanCrowd?: Book;
  lovedLessThanCrowd?: Book;
  crowdFavorite?: Book;
  crowdLeastFavorite?: Book;

  authors: number;
  topAuthors: Count[];
  bestAuthor?: { label: string; count: number; averageRating: number };
  oneOffAuthorShare: number;

  oldest?: Book;
  decades: Count[];
  classicShare: number;
  yearsAfterPublication?: number;

  taggedBooks: number;
  topShelves: Count[];
}

export function shelfStats(books: Book[], today: Date): ShelfStats {
  const byRead = [...books].sort((a, b) => a.read.getTime() - b.read.getTime());
  const withPages = books.filter((book) => book.pages > 0);
  const rated = books.filter((book) => book.rating > 0);
  const crowdRated = rated.filter((book) => book.averageRating > 0);
  const crowdKnown = books.filter((book) => book.averageRating > 0);
  const longest = maxBy(withPages, (book) => book.pages);
  const crowdFavorite = maxBy(crowdKnown, (book) => book.averageRating);
  const published = books.filter((book) => book.published !== undefined);
  const pages = sum(books.map((book) => book.pages));

  const years = yearStats(byRead);
  const thisYear = today.getFullYear();
  const booksThisYear = books.filter((book) => book.read.getFullYear() === thisYear);
  const dayOfYear = Math.ceil((today.getTime() - new Date(thisYear, 0, 1).getTime()) / DAY) || 1;
  const daysInYear = (new Date(thisYear + 1, 0, 1).getTime() - new Date(thisYear, 0, 1).getTime()) / DAY;
  const firstRead = byRead[0]?.read;
  const daysReading = firstRead ? Math.max(1, (today.getTime() - firstRead.getTime()) / DAY) : 1;

  const months = MONTHS.map((label, month) => ({
    label,
    count: books.filter((book) => book.read.getMonth() === month).length,
  }));

  const authorCounts = countBy(books.map((book) => book.author));

  return {
    books: books.length,
    pages,
    years,
    booksPerYear: years.length ? books.length / years.length : 0,
    recordYear: maxBy(years, (year) => year.books),
    months,
    busiestMonth: books.length ? maxBy(months, (month) => month.count) : undefined,
    longestGap: longestGap(byRead),
    longestStreak: longestStreak(byRead),
    pagesPerDay: pages / daysReading,
    pagesPerDayThisYear: sum(booksThisYear.map((book) => book.pages)) / dayOfYear,
    booksThisYear: booksThisYear.length,
    projectedThisYear: Math.round((booksThisYear.length / dayOfYear) * daysInYear),

    averagePages: average(withPages.map((book) => book.pages)),
    medianPages: median(withPages.map((book) => book.pages)),
    longest,
    // Excluding the opposite pick, so a single book is not both at once
    shortest: maxBy(without(withPages, longest), (book) => -book.pages),
    lengths: LENGTHS.map(({ label, max }, i) => {
      const min = LENGTHS[i - 1]?.max ?? 1;
      const inRange = withPages.filter((book) => book.pages >= min && book.pages < max);
      return {
        label,
        count: inRange.length,
        averageRating: average(inRange.filter((book) => book.rating > 0).map((book) => book.rating)),
      };
    }),
    stackMeters: pages * METERS_PER_PAGE,

    averageRating: average(rated.map((book) => book.rating)),
    ratings: [5, 4, 3, 2, 1].map((stars) => ({
      label: '★'.repeat(stars),
      count: rated.filter((book) => book.rating === stars).length,
    })),
    unrated: books.length - rated.length,
    ratingVsCrowd: average(crowdRated.map((book) => book.rating - book.averageRating)),
    lovedMoreThanCrowd: maxBy(
      crowdRated.filter((book) => book.rating > book.averageRating),
      (book) => book.rating - book.averageRating,
    ),
    lovedLessThanCrowd: maxBy(
      crowdRated.filter((book) => book.rating < book.averageRating),
      (book) => book.averageRating - book.rating,
    ),
    crowdFavorite,
    crowdLeastFavorite: maxBy(without(crowdKnown, crowdFavorite), (book) => -book.averageRating),

    authors: authorCounts.length,
    topAuthors: authorCounts.slice(0, 5),
    bestAuthor: bestAuthor(rated),
    oneOffAuthorShare: authorCounts.length
      ? authorCounts.filter((author) => author.count === 1).length / authorCounts.length
      : 0,

    oldest: maxBy(published, (book) => -book.published!),
    decades: countBy(published.map((book) => `${Math.floor(book.published! / 10) * 10}s`)).sort(
      (a, b) => a.label.localeCompare(b.label),
    ),
    classicShare: published.length
      ? published.filter((book) => book.published! <= thisYear - 50).length / published.length
      : 0,
    yearsAfterPublication: average(
      published.map((book) => book.read.getFullYear() - book.published!),
    ),

    taggedBooks: books.filter((book) => book.shelves.length > 0).length,
    topShelves: countBy(books.flatMap((book) => book.shelves)).slice(0, 10),  };
}

// Oldest first, including years without a single book, so the gaps show
function yearStats(byRead: Book[]): YearStats[] {
  if (byRead.length === 0) {
    return [];
  }
  const first = byRead[0].read.getFullYear();
  const last = byRead.at(-1)!.read.getFullYear();
  const years: YearStats[] = [];
  for (let year = first; year <= last; year++) {
    const books = byRead.filter((book) => book.read.getFullYear() === year);
    years.push({
      year,
      books: books.length,
      pages: sum(books.map((book) => book.pages)),
      averageRating: average(books.filter((book) => book.rating > 0).map((book) => book.rating)),
    });
  }
  return years;
}

function longestGap(byRead: Book[]): ShelfStats['longestGap'] {
  let gap: ShelfStats['longestGap'];
  for (let i = 1; i < byRead.length; i++) {
    const days = Math.round((byRead[i].read.getTime() - byRead[i - 1].read.getTime()) / DAY);
    if (!gap || days > gap.days) {
      gap = { days, before: byRead[i - 1], after: byRead[i] };
    }
  }
  return gap;
}

// The most consecutive calendar months with at least one book each
function longestStreak(byRead: Book[]): ShelfStats['longestStreak'] {
  const months = [...new Set(byRead.map((book) => book.read.getFullYear() * 12 + book.read.getMonth()))];
  let best: { length: number; end: number } | undefined;
  let length = 0;
  for (let i = 0; i < months.length; i++) {
    length = months[i] === months[i - 1] + 1 ? length + 1 : 1;
    if (!best || length > best.length) {
      best = { length, end: months[i] };
    }
  }
  if (!best) {
    return undefined;
  }
  const start = best.end - best.length + 1;
  return {
    months: best.length,
    start: new Date(Math.floor(start / 12), start % 12),
    end: new Date(Math.floor(best.end / 12), best.end % 12),
  };
}

// Only authors with at least two rated books, so a single five-star book does not win
function bestAuthor(rated: Book[]): ShelfStats['bestAuthor'] {
  const ratings = new Map<string, number[]>();
  for (const book of rated) {
    ratings.set(book.author, [...(ratings.get(book.author) ?? []), book.rating]);
  }
  const candidates = [...ratings]
    .filter(([, values]) => values.length >= 2)
    .map(([label, values]) => ({ label, count: values.length, averageRating: average(values)! }));
  return maxBy(candidates, (author) => author.averageRating + author.count / 1000);
}

/** Most frequent first */
function countBy(values: string[]): Count[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function maxBy<T>(items: T[], score: (item: T) => number): T | undefined {
  let best: T | undefined;
  for (const item of items) {
    if (best === undefined || score(item) > score(best)) {
      best = item;
    }
  }
  return best;
}

function without<T>(items: T[], item: T | undefined): T[] {
  return items.filter((other) => other !== item);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]): number | undefined {
  return values.length ? sum(values) / values.length : undefined;
}

function median(values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
