import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GoodreadsService } from './goodreads.service';

function feed(title: string, itemCount: number): string {
  const items = '<item><title>Book</title></item>'.repeat(itemCount);
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

  it('parses the username from the channel title', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    expectPage(1).flush(feed("Otis 's bookshelf: read", 3));
    expect(await result).toEqual({ username: 'Otis', readCount: 3 });
  });

  it('sums the read count across pages', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    expectPage(1).flush(feed("Ann's bookshelf: read", 200));
    await new Promise((resolve) => setTimeout(resolve));
    expectPage(2).flush(feed("Ann's bookshelf: read", 37));
    expect(await result).toEqual({ username: 'Ann', readCount: 237 });
  });

  it('rejects when the user does not exist', async () => {
    const result = goodreadsService.fetchReadShelf('42');
    expectPage(1).flush('404 - invalid user_id', { status: 404, statusText: 'Not Found' });
    await expect(result).rejects.toMatchObject({ status: 404 });
  });
});
