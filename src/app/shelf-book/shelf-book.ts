import { Component, computed, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoverColorService, inkFor, toCss } from '../cover-color.service';
import { Book } from '../goodreads.service';
import { showsAuthor, spineHeight, spineStyle, spineTitle, spineWidth } from './spine';

@Component({
  selector: 'li[app-shelf-book]',
  imports: [RouterLink],
  templateUrl: './shelf-book.html',
  styleUrl: './shelf-book.scss',
  host: {
    class: 'shelf-book',
    '[style.--shelf-book-color]': 'color()',
    '[style.--shelf-book-ink]': 'ink()',
  },
})
export class ShelfBook {
  private readonly coverColorService = inject(CoverColorService);

  readonly book = input.required<Book>();
  readonly pairedWithCover = input(false);

  protected readonly width = computed(() => spineWidth(this.book().pages));
  protected readonly height = computed(() => spineHeight(this.book().id));
  protected readonly styleClass = computed(() => `shelf-book-${spineStyle(this.book().id)}`);
  protected readonly title = computed(() => spineTitle(this.book().title));
  protected readonly author = computed(() => {
    const surname = this.book().author.split(' ').pop() ?? '';
    return showsAuthor(this.width(), this.title(), surname) ? surname : undefined;
  });

  private readonly coverColor = resource({
    params: () => this.book().thumbnailUrl,
    loader: ({ params }) => this.coverColorService.colorOf(params),
  });
  // Until the cover is read (or if it fails), the spine keeps the neutral color from the stylesheet
  protected readonly color = computed(() =>
    this.coverColor.hasValue() ? toCss(this.coverColor.value()) : null,
  );
  protected readonly ink = computed(() =>
    this.coverColor.hasValue() ? inkFor(this.coverColor.value()) : null,
  );

  // Warms the browser cache, so the opened view has the large cover before its transition
  protected preloadCover(): void {
    const url = this.book().coverUrl;
    if (url) {
      new Image().src = url;
    }
  }
}
