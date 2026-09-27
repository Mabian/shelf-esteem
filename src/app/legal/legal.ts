import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';

import { IMPRINT, LANGUAGES, Language, PRIVACY } from './legal-content';

export type LegalTopic = 'imprint' | 'privacy';

@Component({
  selector: 'app-legal',
  templateUrl: './legal.html',
  styleUrl: './legal.scss',
})
export class Legal {
  protected readonly languages = LANGUAGES;
  protected readonly imprint = IMPRINT;
  protected readonly topic = signal<LegalTopic>('imprint');
  protected readonly language = signal<Language>('en');

  protected readonly imprintText = computed(() => IMPRINT.text[this.language()]);
  protected readonly privacyText = computed(() => PRIVACY[this.language()]);
  protected readonly title = computed(() =>
    this.topic() === 'imprint' ? this.imprintText().title : this.privacyText().title,
  );

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(topic: LegalTopic): void {
    this.topic.set(topic);
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }
}
