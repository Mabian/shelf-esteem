import {
  SPINE_STYLES,
  spineLettering,
  spineHeight,
  spineStyle,
  spineTitle,
  spineWidth,
} from './spine';

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

  it('keeps short titles at full size on one line', () => {
    expect(spineLettering('serif', 'Dune', 'Herbert', 20, 140)).toEqual({
      style: 'serif',
      fontSize: 13,
      lines: 1,
      showsAuthor: false,
    });
  });

  it('shrinks long titles on thin spines, but not below 9px', () => {
    const lettering = spineLettering('sans', 'A Pocket Full of Rye', 'Christie', 20, 130);
    expect(lettering.lines).toBe(1);
    expect(lettering.fontSize).toBeLessThan(11.5);
    expect(lettering.fontSize).toBeGreaterThanOrEqual(9);
    expect(
      spineLettering('classic', 'The Lion, the Witch and the Wardrobe', 'Lewis', 18, 122).fontSize,
    ).toBe(9);
  });

  it('breaks long titles onto two lines on thick spines', () => {
    const lettering = spineLettering('serif', 'The Count of Monte Cristo', 'Dumas', 44, 140);
    expect(lettering.lines).toBe(2);
    expect(lettering.fontSize).toBeGreaterThan(
      spineLettering('serif', 'The Count of Monte Cristo', 'Dumas', 20, 140).fontSize,
    );
  });

  it('shows the author only on thick spines with room to spare', () => {
    expect(spineLettering('sans', '1929', 'Sorkin', 32, 140).showsAuthor).toBe(true);
    expect(spineLettering('sans', '1929', 'Sorkin', 24, 140).showsAuthor).toBe(false);
    expect(spineLettering('sans', 'The Count of Monte Cristo', 'Dumas', 40, 140).showsAuthor).toBe(
      false,
    );
  });

  it('switches a title too long for its lettering to a narrower one', () => {
    const lettering = spineLettering('classic', 'Dirtbag Billionaire', 'Grant', 22, 152);
    expect(lettering.style).toBe('display');
    expect(lettering.fontSize).toBeGreaterThanOrEqual(13);
  });

  it('never sets Bebas Neue below 13px, falling back to a lettering that stays crisp', () => {
    const lettering = spineLettering(
      'display',
      'A Brief History of Intelligence',
      'Bennett',
      26,
      143,
    );
    expect(lettering.style).not.toBe('display');
    expect(lettering.fontSize).toBeGreaterThanOrEqual(9);
  });

  it('never makes a line wider than the spine allows', () => {
    expect(spineLettering('display', 'Dune', 'Herbert', 18, 140).fontSize).toBeLessThanOrEqual(
      18 * 0.72,
    );
  });
});
