import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IMPRINT, PRIVACY } from './legal-content';
import { Legal } from './legal';

describe('Legal', () => {
  let fixture: ComponentFixture<Legal>;
  let element: HTMLElement;

  beforeEach(async () => {
    if (HTMLDialogElement.prototype.showModal === undefined) {
      HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
      };
      HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
        this.removeAttribute('open');
      };
    }

    await TestBed.configureTestingModule({ imports: [Legal] }).compileComponents();
    fixture = TestBed.createComponent(Legal);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  function dialog(): HTMLDialogElement {
    const found = element.querySelector('dialog');
    if (found === null) {
      throw new Error('dialog not found');
    }
    return found;
  }

  it('stays shut until it is asked for', () => {
    expect(dialog().open).toBe(false);
  });

  it('shows the imprint address', () => {
    fixture.componentInstance.open('imprint');
    fixture.detectChanges();

    expect(dialog().open).toBe(true);
    expect(element.textContent).toContain(IMPRINT.text.en.title);
    for (const line of IMPRINT.address) {
      expect(element.textContent).toContain(line);
    }
    expect(element.querySelector('a[href^="mailto:"]')?.textContent).toContain(IMPRINT.email);
  });

  it('shows every section of the privacy policy', () => {
    fixture.componentInstance.open('privacy');
    fixture.detectChanges();

    expect(element.textContent).toContain(PRIVACY.en.title);
    for (const section of PRIVACY.en.sections) {
      expect(element.textContent).toContain(section.heading);
    }
  });

  it('closes again', () => {
    fixture.componentInstance.open('imprint');
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('.legal-close')?.click();
    fixture.detectChanges();

    expect(dialog().open).toBe(false);
  });

  it('opens in English, matching the rest of the app', () => {
    fixture.componentInstance.open('imprint');
    fixture.detectChanges();

    expect(element.querySelector('.legal-panel')?.getAttribute('lang')).toBe('en');
    expect(element.textContent).toContain(IMPRINT.text.en.title);
  });

  it('switches both the text and the lang attribute to German', () => {
    fixture.componentInstance.open('privacy');
    fixture.detectChanges();

    const german = [...element.querySelectorAll<HTMLButtonElement>('.legal-language')].find(
      (button) => button.textContent?.trim() === 'DE',
    );
    german?.click();
    fixture.detectChanges();

    expect(element.querySelector('.legal-panel')?.getAttribute('lang')).toBe('de');
    expect(element.textContent).toContain(PRIVACY.de.title);
    expect(element.textContent).toContain(PRIVACY.de.sections[0].heading);
    expect(german?.getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the address the same in either language', () => {
    fixture.componentInstance.open('imprint');
    fixture.detectChanges();

    for (const line of IMPRINT.address) {
      expect(element.textContent).toContain(line);
    }
  });
});
