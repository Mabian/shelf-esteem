import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

export interface Book {
  id: string;
  title: string;
  author: string;
  /** 0 when Goodreads has no page count. */
  pages: number;
  /** The user's own rating */
  rating: number;
  /** When the user read the book, or added it to the shelf if no read date was entered. */
  read: Date;
  /** The Goodreads community average, 0 when nobody rated it */
  averageRating: number;
  /** Year of first publication, undefined when Goodreads does not know it. */
  published?: number;
  /** The user's own shelf tags besides "read" */
  shelves: string[];
  /** The blurb as plain text paragraphs, empty when Goodreads has none. Sometimes cut off with "…". */
  description: string[];
  /** Missing when Goodreads only has its gray placeholder. */
  coverUrl?: string;
  thumbnailUrl?: string;
}

export interface ReadShelf {
  username: string;
  books: Book[];
}

// A page takes Goodreads longer the more items it holds (about 8 s for 200), so the shelf comes
// in small pages, many at once. The feed has no total count, so a wave of pages goes out at a
// time until one comes back short.
const PAGE_SIZE = 50;
const PAGES_PER_WAVE = 10;

@Service()
export class GoodreadsService {
  private readonly http = inject(HttpClient);
  private readonly shelves = new Map<string, Promise<ReadShelf>>();
  private readonly loaded = new Map<string, ReadShelf>();

  /** `onProgress` hears the number of books downloaded so far, unless the shelf is already cached. */
  fetchReadShelf(userId: string, onProgress?: (books: number) => void): Promise<ReadShelf> {
    let shelf = this.shelves.get(userId);
    if (!shelf) {
      shelf = this.download(userId, onProgress);
      shelf.then(
        (loaded) => this.loaded.set(userId, loaded),
        () => this.shelves.delete(userId),
      );
      this.shelves.set(userId, shelf);
    }
    return shelf;
  }

  // Without waiting a tick, so the opened book is there in the view transition's first frame
  loadedShelf(userId: string): ReadShelf | undefined {
    return this.loaded.get(userId);
  }

  private async download(
    userId: string,
    onProgress?: (books: number) => void,
  ): Promise<ReadShelf> {
    let username = '';
    const books: Book[] = [];
    let downloaded = 0;
    for (let first = 1; ; first += PAGES_PER_WAVE) {
      const wave = await Promise.all(
        Array.from({ length: PAGES_PER_WAVE }, async (_, i) => {
          const feed = await this.fetchPage(userId, first + i);
          const items = [...feed.querySelectorAll('item')];
          downloaded += items.length;
          onProgress?.(downloaded);
          return { feed, items };
        }),
      );
      if (first === 1) {
        username = parseUsername(wave[0].feed);
      }
      for (const { items } of wave) {
        books.push(...items.map(parseBook));
      }
      if (wave.some(({ items }) => items.length < PAGE_SIZE)) {
        return { username, books };
      }
    }
  }

  private async fetchPage(userId: string, page: number): Promise<Document> {
    const xml = await firstValueFrom(
      this.http.get(`${environment.goodreadsUrl}/review/list_rss/${encodeURIComponent(userId)}`, {
        params: { shelf: 'read', per_page: PAGE_SIZE, page },
        responseType: 'text',
      }),
    );
    return new DOMParser().parseFromString(xml, 'application/xml');
  }
}

function parseUsername(feed: Document): string {
  const title = feed.querySelector('channel > title')?.textContent ?? '';
  return title.match(/^(.*?)\s*'s bookshelf/)?.[1].trim() ?? title;
}

function parseBook(item: Element): Book {
  const text = (selector: string) => item.querySelector(selector)?.textContent?.trim() ?? '';
  return {
    id: text('book_id'),
    title: text('title'),
    author: text('author_name'),
    // num_pages sits inside a nested <book> element
    pages: Number(text('num_pages')) || 0,
    rating: Number(text('user_rating')) || 0,
    read: new Date(text('user_read_at') || text('user_date_added')),
    averageRating: Number(text('average_rating')) || 0,
    published: Number(text('book_published')) || undefined,
    shelves: text('user_shelves')
      .split(',')
      .map((shelf) => shelf.trim())
      .filter((shelf) => shelf !== ''),
    description: paragraphs(text('book_description')),
    coverUrl: cover(text('book_large_image_url')),
    thumbnailUrl: cover(text('book_small_image_url')),
  };
}

function paragraphs(html: string): string[] {
  if (!html) {
    return [];
  }
  const breaks = html.replace(/<br\s*\/?>|<\/p>/gi, '\n');
  const text = new DOMParser().parseFromString(breaks, 'text/html').body.textContent ?? '';
  return text
    .split('\n')
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '');
}

// Books without a cover point at a placeholder, which (unlike real covers) blocks cross-origin reads
function cover(url: string): string | undefined {
  return url && !url.includes('/nophoto/') ? url : undefined;
}
