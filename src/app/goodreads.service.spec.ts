import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../environments/environment';
import { GoodreadsService } from './goodreads.service';

const LONG_SHIPS = `<item>
  <book_id>10081041</book_id>
  <title>The Long Ships</title>
  <author_name>Frans G. Bengtsson</author_name>
  <book_small_image_url><![CDATA[https://example.com/small.jpg]]></book_small_image_url>
  <book_large_image_url><![CDATA[https://example.com/large.jpg]]></book_large_image_url>
  <user_rating>5</user_rating>
  <user_read_at><![CDATA[Tue, 18 Aug 2026 00:00:00 -0700]]></user_read_at>
  <user_date_added><![CDATA[Fri, 11 Sep 2026 10:07:58 -0700]]></user_date_added>
  <user_shelves><![CDATA[adventure, norway]]></user_shelves>
  <average_rating>4.38</average_rating>
  <book_published>1941</book_published>
  <book id="10081041"><num_pages>528</num_pages></book>
</item>`;

const NO_READ_DATE = `<item>
  <book_id>1</book_id>
  <title>Unrated</title>
  <user_rating>0</user_rating>
  <user_read_at></user_read_at>
  <user_date_added><![CDATA[Sat, 01 Mar 2025 12:00:00 +0000]]></user_date_added>
  <book id="1"><num_pages></num_pages></book>
</item>`;

function feed(title: string, items: string): string {
  return `<?xml version="1.0"?><rss><channel><title>${title}</title>${items}</channel></rss>`;
}

describe('GoodreadsService', () => {
  let goodreadsService: GoodreadsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    goodreadsService = TestBed.inject(GoodreadsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function expectPage(page: number) {
    return http.expectOne(
      (req) =>
        req.url === `${environment.goodreadsUrl}/review/list_rss/42` &&
        req.params.get('shelf') === 'read' &&
        req.params.get('per_page') === '50' &&
        req.params.get('page') === String(page),
    );
  }

  // Answers the ten pages requested together, those past the given ones come back empty
  function flushWave(first: number, ...items: string[]) {
    for (let i = 0; i < 10; i++) {
      expectPage(first + i).flush(feed("Otis 's bookshelf: read", items[i] ?? ''));
    }
  }

  it('parses the username and books', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    flushWave(1, LONG_SHIPS);
    expect(await result).toEqual({
      username: 'Otis',
      books: [
        {
          id: '10081041',
          title: 'The Long Ships',
          author: 'Frans G. Bengtsson',
          pages: 528,
          rating: 5,
          read: new Date('2026-08-18T07:00:00Z'),
          averageRating: 4.38,
          published: 1941,
          shelves: ['adventure', 'norway'],
          coverUrl: 'https://example.com/large.jpg',
          thumbnailUrl: 'https://example.com/small.jpg',
        },
      ],
    });
  });

  it('keeps a downloaded shelf at hand synchronously', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    expect(goodreadsService.loadedShelf('42')).toBeUndefined();
    flushWave(1, LONG_SHIPS);
    const shelf = await result;
    expect(goodreadsService.loadedShelf('42')).toBe(shelf);
  });

  it('falls back to the date added and zero pages', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    flushWave(1, NO_READ_DATE);
    const [book] = (await result).books;
    expect(book.read).toEqual(new Date('2025-03-01T12:00:00Z'));
    expect(book.published).toBeUndefined();
    expect(book.shelves).toEqual([]);
    expect(book.pages).toBe(0);
    expect(book.rating).toBe(0);
  });

  it('treats the Goodreads placeholder as no cover', async () => {
    const placeholder = NO_READ_DATE.replace(
      '<user_rating>',
      '<book_large_image_url>https://s.gr-assets.com/assets/nophoto/book/111x148.png</book_large_image_url><user_rating>',
    );
    const result = goodreadsService.fetchReadShelf('42');
    flushWave(1, placeholder);
    expect((await result).books[0].coverUrl).toBeUndefined();
  });

  it('collects books across waves of pages', async () => {
    const progress: number[] = [];
    const result = goodreadsService.fetchReadShelf('42', (books) => progress.push(books));
    flushWave(1, ...Array<string>(10).fill(LONG_SHIPS.repeat(50)));
    await new Promise((resolve) => setTimeout(resolve));
    flushWave(11, LONG_SHIPS.repeat(37));
    expect((await result).books).toHaveLength(537);
    expect(progress.slice(0, 3)).toEqual([50, 100, 150]);
    expect(progress.at(-1)).toBe(537);
  });

  it('keeps the page order when pages arrive out of order', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    const book = (id: string) => LONG_SHIPS.replace('<book_id>10081041', `<book_id>${id}`);
    expectPage(2).flush(feed("Otis 's bookshelf: read", book('second')));
    expectPage(1).flush(feed("Otis 's bookshelf: read", book('first').repeat(50)));
    for (let page = 3; page <= 10; page++) {
      expectPage(page).flush(feed("Otis 's bookshelf: read", ''));
    }
    const ids = (await result).books.map((b) => b.id);
    expect(ids.at(-2)).toBe('first');
    expect(ids.at(-1)).toBe('second');
  });

  it('downloads a shelf only once', async () => {
    const first = goodreadsService.fetchReadShelf('42');
    const second = goodreadsService.fetchReadShelf('42');
    flushWave(1, LONG_SHIPS);
    expect(await second).toBe(await first);
  });

  it('rejects when the user does not exist, and tries again next time', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    for (const request of http.match(() => true)) {
      request.flush('404 - invalid user_id', { status: 404, statusText: 'Not Found' });
    }
    await expect(result).rejects.toMatchObject({ status: 404 });

    goodreadsService.fetchReadShelf('42');
    expect(http.match(() => true)).toHaveLength(10);
  });
});
