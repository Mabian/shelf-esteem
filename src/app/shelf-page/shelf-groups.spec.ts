import { Book } from '../goodreads.service';
import { groupByAuthor, groupByYear } from './shelf-groups';

function book(id: string, read: string, author = ''): Book {
  return {
    id,
    title: id,
    author,
    pages: 0,
    rating: 0,
    read: new Date(read),
    averageRating: 0,
    shelves: [],
    description: [],
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
    expect(groups.map((group) => [group.label, group.books.map((b) => b.id)])).toEqual([
      ['2026', ['d', 'b']],
      ['2024', ['c', 'a']],
    ]);
  });

  it('returns no groups for an empty shelf', () => {
    expect(groupByYear([])).toEqual([]);
  });
});

describe('groupByAuthor', () => {
  it('groups by the initial of the surname, only for letters that occur', () => {
    const groups = groupByAuthor([
      book('dune', '2024-01-01', 'Frank Herbert'),
      book('emma', '2024-01-01', 'Jane Austen'),
      book('hobbit', '2024-01-01', 'J.R.R. Tolkien'),
      book('persuasion', '2024-01-01', 'Jane Austen'),
      book('herland', '2024-01-01', 'Charlotte Perkins Gilman'),
    ]);
    expect(groups.map((group) => [group.label, group.books.map((b) => b.id)])).toEqual([
      ['A', ['emma', 'persuasion']],
      ['G', ['herland']],
      ['H', ['dune']],
      ['T', ['hobbit']],
    ]);
  });

  it('files accented initials under their base letter', () => {
    const groups = groupByAuthor([
      book('silence', '2024-01-01', 'Kenzaburō Ōe'),
      book('ulysses', '2024-01-01', 'James Joyce'),
      book('1984', '2024-01-01', 'George Orwell'),
    ]);
    expect(groups.map((group) => [group.label, group.books.map((b) => b.id)])).toEqual([
      ['J', ['ulysses']],
      ['O', ['silence', '1984']],
    ]);
  });
});
