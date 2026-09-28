import { Book } from '../goodreads.service';
import { groupByYear } from './year-groups';

function book(id: string, read: string): Book {
  return {
    id,
    title: id,
    author: '',
    pages: 0,
    rating: 0,
    read: new Date(read),
    averageRating: 0,
    shelves: [],
  };
}

describe('groupByYear', () => {
  it('groups by year read, newest first', () => {
    const groups = groupByYear([
      book('a', '2024-03-01'),
      book('b', '2026-01-10'),
      book('c', '2024-11-20'),
      book('d', '2026-06-05'),
    ]);
    expect(groups.map((group) => [group.year, group.books.map((b) => b.id)])).toEqual([
      [2026, ['d', 'b']],
      [2024, ['c', 'a']],
    ]);
  });

  it('returns no groups for an empty shelf', () => {
    expect(groupByYear([])).toEqual([]);
  });
});
