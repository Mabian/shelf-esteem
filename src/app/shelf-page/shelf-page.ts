import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  input,
  resource,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import type { BookView } from '../book-view/book-view';
import { Footer } from '../footer/footer';
import { CoverColorService, Rgb } from '../cover-color.service';
import { GoodreadsService } from '../goodreads.service';
import { RoomScene } from '../room-scene/room-scene';
import { ShelfBook } from '../shelf-book/shelf-book';
import { ShelfStats } from '../shelf-stats/shelf-stats';
import { groupByAuthor, groupByColor, groupByYear } from './shelf-groups';

@Component({
  selector: 'app-shelf-page',
  imports: [RouterLink, RouterOutlet, ShelfBook, ShelfStats, Footer, RoomScene],
  templateUrl: './shelf-page.html',
  styleUrl: './shelf-page.scss',
})
export class ShelfPage {
  private readonly goodreadsService = inject(GoodreadsService);
  private readonly coverColorService = inject(CoverColorService);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  readonly userId = input.required<string>();

  protected readonly bookcases = [
    { value: 'walnut', label: 'Walnut', swatch: '#5a3a26' },
    { value: 'oak', label: 'Oak', swatch: '#c3915a' },
    { value: 'lavender', label: 'Lavender', swatch: '#cfc6f7' },
    { value: 'white', label: 'White', swatch: '#fbfbfd' },
  ];
  protected readonly bookcase = signal('walnut');
  protected readonly rooms = [
    {
      value: 'day',
      label: 'Daylight',
      swatch:
        'radial-gradient(circle at 68% 32%, #ffe27a 18%, transparent 21%), linear-gradient(#7cc6f2 60%, #7cc36d 60%)',
    },
    {
      value: 'city',
      label: 'City night',
      swatch:
        'radial-gradient(circle at 68% 30%, #fdf3c8 14%, transparent 17%), linear-gradient(#2e2560 55%, #ffd88a 55% 62%, #14142e 62%)',
    },
    { value: 'snow', label: 'Snow', swatch: 'linear-gradient(#b7c6d8 55%, #ffffff 55%)' },
    {
      value: 'beach',
      label: 'Beach',
      swatch: 'linear-gradient(#6fcbee 42%, #1f8fc2 42% 68%, #f1d7a0 68%)',
    },
  ];
  protected readonly room = signal('day');
  protected readonly sorts = [
    { value: 'year', label: 'By year' },
    { value: 'author', label: 'By author' },
    { value: 'color', label: 'By color' },
  ];
  protected readonly sort = signal('year');
  protected readonly newShelfPerYear = signal(false);

  protected readonly booksLoaded = signal(0);
  // The count only shows once loading takes a while, so quick loads do not flicker
  protected readonly loadingSlowly = signal(false);
  protected readonly shelf = resource({
    params: () => this.userId(),
    loader: ({ params }) => {
      this.booksLoaded.set(0);
      this.loadingSlowly.set(false);
      const timer = setTimeout(() => this.loadingSlowly.set(true), 1000);
      return this.goodreadsService
        .fetchReadShelf(params, (books) => this.booksLoaded.set(books))
        .finally(() => clearTimeout(timer));
    },
  });
  // The spines request the same colors, so these mostly come from the cache. Loaded with the
  // shelf, not on switching to color, so the switch is instant.
  private readonly spineColors = resource({
    params: () => (this.shelf.hasValue() ? this.shelf.value().books : undefined),
    loader: async ({ params }) => {
      const colors = new Map<string, Rgb>();
      await Promise.all(
        params.map(async (book) => {
          if (book.thumbnailUrl) {
            const color = await this.coverColorService
              .colorOf(book.thumbnailUrl)
              .catch(() => undefined);
            if (color) {
              colors.set(book.id, color);
            }
          }
        }),
      );
      return colors;
    },
  });
  protected readonly groups = computed(() => {
    if (!this.shelf.hasValue()) {
      return [];
    }
    const books = this.shelf.value().books;
    switch (this.sort()) {
      case 'author':
        return groupByAuthor(books);
      // Until every spine's color is read, the shelf keeps its years instead of reshuffling
      // with each color that arrives
      case 'color':
        if (this.spineColors.hasValue()) {
          return groupByColor(books, this.spineColors.value());
        }
    }
    return groupByYear(books);
  });
  protected readonly errorMessage = computed(() => {
    const error = this.shelf.error();
    if (!error) {
      return undefined;
    }
    const status = error instanceof HttpErrorResponse ? error.status : undefined;
    if (status === 404) {
      return 'No Goodreads user found with that ID.';
    }
    // Goodreads refuses the feed of profiles set to private (friends only)
    if (status === 401) {
      return 'This Goodreads profile is private, so its shelf cannot be shown.';
    }
    return 'Could not load the shelf. Please try again.';
  });

  protected readonly bookOpen = signal(false);
  // Unlike bookOpen, already false when the navigation back starts, so the shelf is painted before
  // the view transition captures its old state instead of in the middle of the morph
  protected readonly shelfCovered = signal(false);
  protected readonly selectedId = signal<string | undefined>(undefined);
  // While true, a shield covers the page so books gliding under the pointer do not tip out one
  // after another, which made scrolling stutter, and the room's animations hold still
  protected readonly scrolling = signal(false);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.shelfCovered.set(false);
      }
    });

    // A plain listener instead of a host binding, so scroll events do not each run change
    // detection over every book, the signal only changes when scrolling starts and stops
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      this.scrolling.set(true);
      clearTimeout(timer);
      timer = setTimeout(() => this.scrolling.set(false), 150);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    });
  }

  protected onBookOpened(view: BookView): void {
    this.selectedId.set(view.bookId());
    this.bookOpen.set(true);
    this.shelfCovered.set(true);
  }

  protected onBookClosed(): void {
    this.bookOpen.set(false);
    const id = this.selectedId();
    afterNextRender(() => document.getElementById(`book-${id}`)?.focus({ preventScroll: true }), {
      injector: this.injector,
    });
  }
}
