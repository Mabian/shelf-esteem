import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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
        req.url === '/goodreads/review/list_rss/42' &&
        req.params.get('shelf') === 'read' &&
        req.params.get('page') === String(page),
    );
  }

  it('parses the username and books', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    expectPage(1).flush(feed("Otis 's bookshelf: read", LONG_SHIPS));
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
          coverUrl: 'https://example.com/large.jpg',
          thumbnailUrl: 'https://example.com/small.jpg',
        },
      ],
    });
  });

  it('falls back to the date added and zero pages', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    expectPage(1).flush(feed("Ann's bookshelf: read", NO_READ_DATE));
    const [book] = (await result).books;
    expect(book.read).toEqual(new Date('2025-03-01T12:00:00Z'));
    expect(book.pages).toBe(0);
    expect(book.rating).toBe(0);
  });

  it('treats the Goodreads placeholder as no cover', async () => {
    const placeholder = NO_READ_DATE.replace(
      '<user_rating>',
      '<book_large_image_url>https://s.gr-assets.com/assets/nophoto/book/111x148.png</book_large_image_url><user_rating>',
    );
    const result = goodreadsService.fetchReadShelf('42');
    expectPage(1).flush(feed("Ann's bookshelf: read", placeholder));
    expect((await result).books[0].coverUrl).toBeUndefined();
  });

  it('collects books across pages', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    expectPage(1).flush(feed("Ann's bookshelf: read", LONG_SHIPS.repeat(200)));
    await new Promise((resolve) => setTimeout(resolve));
    expectPage(2).flush(feed("Ann's bookshelf: read", LONG_SHIPS.repeat(37)));
    expect((await result).books).toHaveLength(237);
  });

  it('downloads a shelf only once', async () => {
    const first = goodreadsService.fetchReadShelf('42');
    const second = goodreadsService.fetchReadShelf('42');
    expectPage(1).flush(feed("Ann's bookshelf: read", LONG_SHIPS));
    expect(await second).toBe(await first);
  });

  it('rejects when the user does not exist, and tries again next time', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    expectPage(1).flush('404 - invalid user_id', { status: 404, statusText: 'Not Found' });
    await expect(result).rejects.toMatchObject({ status: 404 });

    goodreadsService.fetchReadShelf('42');
    expectPage(1);
  });
});
