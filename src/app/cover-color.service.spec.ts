import { dominantColor, inkFor, Rgb } from './cover-color.service';

function pixels(...colors: [Rgb, number][]): Uint8ClampedArray {
  const data: number[] = [];
  for (const [[r, g, b], count] of colors) {
    for (let i = 0; i < count; i++) {
      data.push(r, g, b, 255);
    }
  }
  return new Uint8ClampedArray(data);
}

describe('dominantColor', () => {
  it('returns the most common color', () => {
    expect(dominantColor(pixels([[200, 30, 30], 10], [[20, 20, 20], 4]))).toEqual([200, 30, 30]);
  });

  it('favors saturated colors over a slightly larger gray area', () => {
    expect(dominantColor(pixels([[240, 240, 240], 12], [[30, 90, 200], 8]))).toEqual([30, 90, 200]);
  });
});

describe('inkFor', () => {
  it('picks white on dark and ink on light backgrounds', () => {
    expect(inkFor([20, 20, 20])).toBe('#ffffff');
    expect(inkFor([250, 240, 200])).toBe('#26214a');
  });
});
