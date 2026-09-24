import { DatePipe, Location } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  resource,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { CoverColorService, toCss } from '../cover-color.service';
import { GoodreadsService } from '../goodreads.service';

@Component({
  selector: 'app-book-view',
  imports: [DatePipe],
  templateUrl: './book-view.html',
  styleUrl: './book-view.scss',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class BookView {
  private readonly goodreadsService = inject(GoodreadsService);
  private readonly coverColorService = inject(CoverColorService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly userId = input.required<string>();
  readonly bookId = input.required<string>();

  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');

  // Served from the cache the shelf page already filled
  private readonly shelf = resource({
    params: () => this.userId(),
    loader: ({ params }) => this.goodreadsService.fetchReadShelf(params),
  });
  protected readonly book = computed(() =>
    this.shelf.hasValue()
      ? this.shelf.value().books.find((book) => book.id === this.bookId())
      : undefined,
  );

  private readonly coverColor = resource({
    params: () => this.book()?.thumbnailUrl,
    loader: ({ params }) => this.coverColorService.colorOf(params),
  });
  protected readonly backgroundColor = computed(() =>
    this.coverColor.hasValue() ? toCss(this.coverColor.value()) : null,
  );

  protected readonly stars = computed(() => {
    const rating = this.book()?.rating ?? 0;
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  });

  constructor() {
    afterNextRender(() => this.closeButton().nativeElement.focus());
    effect(() => {
      if (this.shelf.hasValue() && !this.book()) {
        this.router.navigate(['/shelf', this.userId()], { replaceUrl: true });
      }
    });
  }

  protected close(): void {
    // Going back keeps the history clean when the book was opened from the shelf,
    // so the close button and the browser's back button do the same thing
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      this.location.back();
    } else {
      this.router.navigate(['/shelf', this.userId()]);
    }
  }

  protected onBackgroundClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.book-view-cover, .book-view-caption, .book-view-close')) {
      this.close();
    }
  }
}
