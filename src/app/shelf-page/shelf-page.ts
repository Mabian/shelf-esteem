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
import { RouterLink, RouterOutlet } from '@angular/router';
import type { BookView } from '../book-view/book-view';
import { Footer } from '../footer/footer';
import { GoodreadsService } from '../goodreads.service';
import { ShelfBook } from '../shelf-book/shelf-book';
import { groupByYear } from './year-groups';

@Component({
  selector: 'app-shelf-page',
  imports: [RouterLink, RouterOutlet, ShelfBook, Footer],
  templateUrl: './shelf-page.html',
  styleUrl: './shelf-page.scss',
})
export class ShelfPage {
  private readonly goodreadsService = inject(GoodreadsService);
  private readonly injector = inject(Injector);

  readonly userId = input.required<string>();

  protected readonly bookcases = [
    { value: 'walnut', label: 'Walnut', swatch: '#5a3a26' },
    { value: 'oak', label: 'Oak', swatch: '#c3915a' },
    { value: 'lavender', label: 'Lavender', swatch: '#cfc6f7' },
    { value: 'white', label: 'White', swatch: '#fbfbfd' },
  ];
  protected readonly bookcase = signal('walnut');
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
  protected readonly selectedId = signal<string | undefined>(undefined);

  protected onBookOpened(view: BookView): void {
    this.selectedId.set(view.bookId());
    this.bookOpen.set(true);
  }

  protected onBookClosed(): void {
    this.bookOpen.set(false);
    const id = this.selectedId();
    afterNextRender(() => document.getElementById(`book-${id}`)?.focus({ preventScroll: true }), {
      injector: this.injector,
    });
  }
}
