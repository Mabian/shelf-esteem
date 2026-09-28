import { DatePipe, DecimalPipe, NgTemplateOutlet, PercentPipe } from '@angular/common';
import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  resource,
  viewChild,
} from '@angular/core';
import { CoverColorService, Rgb, toCss } from '../cover-color.service';
import { Book } from '../goodreads.service';
import { shelfStats } from './stats';

@Component({
  selector: 'app-shelf-stats',
  imports: [DatePipe, DecimalPipe, NgTemplateOutlet, PercentPipe],
  templateUrl: './shelf-stats.html',
  styleUrl: './shelf-stats.scss',
})
export class ShelfStats {
  private readonly coverColorService = inject(CoverColorService);

  readonly books = input.required<Book[]>();

  protected readonly stats = computed(() => shelfStats(this.books(), new Date()));
  protected readonly yearRows = computed(() =>
    this.stats().years.map((year) => ({ label: String(year.year), count: year.books })),
  );

  // The spines already asked for these colors, so they come from the cache
  private readonly colors = resource({
    params: () => this.books().flatMap((book) => book.thumbnailUrl ?? []),
    loader: async ({ params }) => {
      const results = await Promise.allSettled(
        params.map((url) => this.coverColorService.colorOf(url)),
      );
      return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    },
  });
  protected readonly colorBand = computed(() =>
    this.colors.hasValue() ? [...this.colors.value()].sort(byHue).map(toCss) : [],
  );

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected barWidth(count: number, counts: { count: number }[]): string {
    const max = Math.max(...counts.map((entry) => entry.count));
    return max ? `${(count / max) * 100}%` : '0';
  }
}

// Grays (barely saturated) go last, sorted by lightness, the rest along the color wheel
function byHue(a: Rgb, b: Rgb): number {
  const [hueA, saturationA, lightnessA] = hsl(a);
  const [hueB, saturationB, lightnessB] = hsl(b);
  const grayA = saturationA < 0.15;
  const grayB = saturationB < 0.15;
  if (grayA !== grayB) {
    return grayA ? 1 : -1;
  }
  return grayA ? lightnessB - lightnessA : hueA - hueB;
}

function hsl([r, g, b]: Rgb): [number, number, number] {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) {
    return [0, 0, lightness];
  }
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const sector = max === rn ? (gn - bn) / delta : max === gn ? (bn - rn) / delta + 2 : (rn - gn) / delta + 4;
  return [((sector * 60) + 360) % 360, saturation, lightness];
}
