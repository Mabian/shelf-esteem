import { Book } from '../goodreads.service';
import { shelfStats } from './stats';

function book(id: string, read: string, extra: Partial<Book> = {}): Book {
  return {
    id,
    title: id,
    author: 'Anon',
    pages: 0,
    rating: 0,
    read: new Date(read),
    averageRating: 0,
    shelves: [],
    description: [],
    ...extra,
  };
}

const TODAY = new Date(2026, 6, 1);

describe('shelfStats', () => {
  it('counts books and pages per year, including empty years', () => {
    const stats = shelfStats(
      [
        book('a', '2023-05-01', { pages: 100 }),
        book('b', '2025-02-01', { pages: 300 }),
        book('c', '2025-08-01', { pages: 200 }),
      ],
      TODAY,
    );
    expect(stats.books).toBe(3);
    expect(stats.pages).toBe(600);
    expect(stats.years.map((year) => [year.year, year.books, year.pages])).toEqual([
      [2023, 1, 100],
      [2024, 0, 0],
      [2025, 2, 500],
    ]);
    expect(stats.recordYear?.year).toBe(2025);
    expect(stats.medianPages).toBe(200);
    expect(stats.longest?.id).toBe('b');
    expect(stats.shortest?.id).toBe('a');
  });

  it('projects the current year from the pace so far', () => {
    const stats = shelfStats([book('a', '2026-02-01'), book('b', '2026-05-01')], TODAY);
    expect(stats.booksThisYear).toBe(2);
    expect(stats.projectedThisYear).toBe(4);
  });

  it('finds the longest gap and the longest monthly streak', () => {
    const stats = shelfStats(
      [
        book('a', '2025-01-10'),
        book('b', '2025-02-10'),
        book('c', '2025-03-10'),
        book('d', '2025-09-10'),
      ],
      TODAY,
    );
    expect(stats.longestGap?.before.id).toBe('c');
    expect(stats.longestGap?.after.id).toBe('d');
    expect(stats.longestStreak?.months).toBe(3);
    expect(stats.longestStreak?.start).toEqual(new Date(2025, 0));
  });

  it('compares the user with the crowd, ignoring unrated books', () => {
    const stats = shelfStats(
      [
        book('loved', '2025-01-01', { rating: 5, averageRating: 3.2 }),
        book('panned', '2025-01-02', { rating: 1, averageRating: 4.5 }),
        book('unrated', '2025-01-03', { averageRating: 4.9 }),
      ],
      TODAY,
    );
    expect(stats.averageRating).toBe(3);
    expect(stats.unrated).toBe(1);
    expect(stats.lovedMoreThanCrowd?.id).toBe('loved');
    expect(stats.lovedLessThanCrowd?.id).toBe('panned');
    expect(stats.crowdFavorite?.id).toBe('unrated');
  });

  it('does not name a single rated book both over and under the crowd', () => {
    const stats = shelfStats(
      [book('only', '2025-01-01', { rating: 5, averageRating: 4.1, pages: 300 })],
      TODAY,
    );
    expect(stats.lovedMoreThanCrowd?.id).toBe('only');
    expect(stats.lovedLessThanCrowd).toBeUndefined();
    expect(stats.crowdFavorite?.id).toBe('only');
    expect(stats.crowdLeastFavorite).toBeUndefined();
    expect(stats.longest?.id).toBe('only');
    expect(stats.shortest).toBeUndefined();
  });

  it('ranks authors and only crowns one with at least two rated books', () => {
    const stats = shelfStats(
      [
        book('a', '2025-01-01', { author: 'Le Guin', rating: 4 }),
        book('b', '2025-01-02', { author: 'Le Guin', rating: 5 }),
        book('c', '2025-01-03', { author: 'Once', rating: 5 }),
      ],
      TODAY,
    );
    expect(stats.topAuthors[0]).toEqual({ label: 'Le Guin', count: 2 });
    expect(stats.bestAuthor).toEqual({ label: 'Le Guin', count: 2, averageRating: 4.5 });
    expect(stats.oneOffAuthorShare).toBe(0.5);
  });

  it('groups publication years into decades', () => {
    const stats = shelfStats(
      [
        book('a', '2025-01-01', { published: 1941 }),
        book('b', '2025-01-02', { published: 2019 }),
        book('c', '2025-01-03', { published: 2011 }),
      ],
      TODAY,
    );
    expect(stats.oldest?.id).toBe('a');
    expect(stats.decades).toEqual([
      { label: '1940s', count: 1 },
      { label: '2010s', count: 2 },
    ]);
    expect(stats.classicShare).toBeCloseTo(1 / 3);
  });

  it('copes with an empty shelf', () => {
    const stats = shelfStats([], TODAY);
    expect(stats.books).toBe(0);
    expect(stats.years).toEqual([]);
    expect(stats.averageRating).toBeUndefined();
    expect(stats.busiestMonth).toBeUndefined();
  });
});
