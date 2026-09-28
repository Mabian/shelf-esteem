import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  computed,
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
import { GoodreadsService } from '../goodreads.service';
import { RoomScene } from '../room-scene/room-scene';
import { ShelfBook } from '../shelf-book/shelf-book';
import { ShelfStats } from '../shelf-stats/shelf-stats';
import { groupByYear } from './year-groups';

@Component({
  selector: 'app-shelf-page',
  imports: [RouterLink, RouterOutlet, ShelfBook, ShelfStats, Footer, RoomScene],
  templateUrl: './shelf-page.html',
  styleUrl: './shelf-page.scss',
})
export class ShelfPage {
  private readonly goodreadsService = inject(GoodreadsService);
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
  protected readonly newShelfPerYear = signal(false);

  protected readonly shelf = resource({
    params: () => this.userId(),
    loader: ({ params }) => this.goodreadsService.fetchReadShelf(params),
  });
  protected readonly yearGroups = computed(() =>
    this.shelf.hasValue() ? groupByYear(this.shelf.value().books) : [],
  );
  protected readonly errorMessage = computed(() => {
    const error = this.shelf.error();
    if (!error) {
      return undefined;
    }
    return error instanceof HttpErrorResponse && error.status === 404
      ? 'No Goodreads user found with that ID.'
      : 'Could not load the shelf. Please try again.';
  });

  protected readonly bookOpen = signal(false);
  // Unlike bookOpen, already false when the navigation back starts, so the shelf is painted before
  // the view transition captures its old state instead of in the middle of the morph
  protected readonly shelfCovered = signal(false);
  protected readonly selectedId = signal<string | undefined>(undefined);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.shelfCovered.set(false);
      }
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
