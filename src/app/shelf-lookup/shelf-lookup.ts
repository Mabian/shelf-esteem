import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shelf-lookup',
  imports: [FormField, FormRoot],
  templateUrl: './shelf-lookup.html',
  styleUrl: './shelf-lookup.scss',
})
export class ShelfLookup {
  protected readonly illustrationBooks = [
    { height: 78, color: '#7b6ef6' },
    { height: 92, color: '#ffcc3d' },
    { height: 70, color: '#ff8fa3' },
    { height: 84, color: '#4b3fc4' },
    { height: 96, color: '#6ed3b3' },
    { height: 74, color: '#ffb070' },
    { height: 88, color: '#b3a8ff' },
    { height: 64, color: '#ff8fa3' },
    { height: 90, color: '#7b6ef6' },
  ];

  private readonly router = inject(Router);

  protected readonly lookupForm = form(
    signal({ userId: '' }),
    (path) => required(path.userId, { message: 'Please enter your Goodreads user ID.' }),
    {
      submission: {
        action: async (field) => {
          await this.router.navigate(['/shelf', field.userId().value().trim()]);
        },
      },
    },
  );
}
