import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface ReadShelf {
  username: string;
  readCount: number;
}

// Goodreads caps the RSS feed at 200 items per page, larger values fall back to 100.
const PAGE_SIZE = 200;

@Service()
export class GoodreadsService {
  private readonly http = inject(HttpClient);

  async fetchReadShelf(userId: string): Promise<ReadShelf> {
    let username = '';
    let readCount = 0;
    for (let page = 1; ; page++) {
      const feed = await this.fetchPage(userId, page);
      if (page === 1) {
        username = parseUsername(feed);
      }
      const items = feed.querySelectorAll('item').length;
      readCount += items;
      if (items < PAGE_SIZE) {
        return { username, readCount };
      }
    }
  }

  private async fetchPage(userId: string, page: number): Promise<Document> {
    const xml = await firstValueFrom(
      this.http.get(`/goodreads/review/list_rss/${encodeURIComponent(userId)}`, {
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
