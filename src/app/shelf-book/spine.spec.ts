import { showsAuthor, SPINE_STYLES, spineHeight, spineStyle, spineTitle, spineWidth } from './spine';

describe('spine', () => {
  it('makes thicker books wider, within limits', () => {
    expect(spineWidth(180)).toBe(18);
    expect(spineWidth(361)).toBe(23);
    expect(spineWidth(1360)).toBe(48);
  });

  it('gives books without a page count a typical width', () => {
    expect(spineWidth(0)).toBe(spineWidth(350));
  });

  it('keeps height and style stable per book', () => {
    expect(spineHeight('7126')).toBe(spineHeight('7126'));
    expect(spineStyle('7126')).toBe(spineStyle('7126'));
    for (const id of ['1', '7126', '10081041', '244142515']) {
      expect(spineHeight(id)).toBeGreaterThanOrEqual(122);
      expect(spineHeight(id)).toBeLessThanOrEqual(154);
      expect(SPINE_STYLES).toContain(spineStyle(id));
    }
  });

  it('drops subtitles', () => {
    expect(spineTitle('Ballistic: The New Science of Injury-Free Athletic Performance')).toBe(
      'Ballistic',
    );
    expect(spineTitle('Dune (Dune, #1)')).toBe('Dune');
  });

  it('shows the author only on thick spines with short titles', () => {
    expect(showsAuthor(32, '1929', 'Sorkin')).toBe(true);
    expect(showsAuthor(24, '1929', 'Sorkin')).toBe(false);
    expect(showsAuthor(40, 'The Count of Monte Cristo', 'Dumas')).toBe(false);
  });
});
