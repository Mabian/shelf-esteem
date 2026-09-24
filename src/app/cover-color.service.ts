import { Service } from '@angular/core';

export type Rgb = [number, number, number];

const INK: Rgb = [38, 33, 74];

@Service()
export class CoverColorService {
  private readonly colors = new Map<string, Promise<Rgb>>();

  /** The most common color of a cover image */
  colorOf(imageUrl: string): Promise<Rgb> {
    let color = this.colors.get(imageUrl);
    if (!color) {
      color = loadImage(imageUrl).then(readPixels).then(dominantColor);
      this.colors.set(imageUrl, color);
    }
    return color;
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function readPixels(image: HTMLImageElement): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 24;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height).data;
}

/**
 * Groups RGBA pixels into coarse color buckets and returns the average of the heaviest bucket.
 * Saturated pixels weigh more, so a colorful cover is not drowned out by its white margins.
 */
export function dominantColor(pixels: Uint8ClampedArray): Rgb {
  const buckets = new Map<number, { weight: number; r: number; g: number; b: number }>();
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const weight = 1 + (Math.max(r, g, b) - Math.min(r, g, b)) / 48;
    const key = (r >> 5) * 64 + (g >> 5) * 8 + (b >> 5);
    const bucket = buckets.get(key) ?? { weight: 0, r: 0, g: 0, b: 0 };
    bucket.weight += weight;
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
    buckets.set(key, bucket);
  }
  const top = [...buckets.values()].reduce((a, b) => (b.weight > a.weight ? b : a));
  return [top.r / top.weight, top.g / top.weight, top.b / top.weight].map(Math.round) as Rgb;
}

/** White or the ink color, whichever contrasts more with the given background. */
export function inkFor(background: Rgb): string {
  const l = luminance(background);
  const onWhite = 1.05 / (l + 0.05);
  const onInk = (l + 0.05) / (luminance(INK) + 0.05);
  return onWhite > onInk ? '#ffffff' : '#26214a';
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function toCss(rgb: Rgb): string {
  return `rgb(${rgb.join(' ')})`;
}
