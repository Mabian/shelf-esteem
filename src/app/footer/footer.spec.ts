import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Footer } from './footer';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Footer] }).compileComponents();
    fixture = TestBed.createComponent(Footer);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  });

  it('offers the legal texts and a way to get in touch', () => {
    const links = [...element.querySelectorAll('.app-footer-link')].map((link) =>
      link.textContent?.trim(),
    );

    expect(links).toEqual(['Legal Notice', 'Privacy Policy']);
    expect(element.querySelector('.app-footer-github')?.getAttribute('href')).toBe(
      'https://github.com/Mabian',
    );
  });
});
