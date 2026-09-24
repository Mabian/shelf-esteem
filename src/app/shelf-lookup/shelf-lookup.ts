import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, resource, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { GoodreadsService } from '../goodreads.service';

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

  private readonly goodreadsService = inject(GoodreadsService);
  private readonly submittedId = signal<string | undefined>(undefined);

  protected readonly lookupForm = form(
    signal({ userId: '' }),
    (path) => required(path.userId, { message: 'Please enter your Goodreads user ID.' }),
    {
      submission: {
        action: async (field) => this.submittedId.set(field.userId().value().trim()),
      },
    },
  );

  protected readonly shelf = resource({
    params: () => this.submittedId(),
    loader: ({ params }) => this.goodreadsService.fetchReadShelf(params),
  });

  protected readonly errorMessage = computed(() => {
    const error = this.shelf.error();
    if (!error) {
      return undefined;
    }
    return error instanceof HttpErrorResponse && error.status === 404
      ? 'No Goodreads user found with that ID.'
      : 'Could not load the shelf. Please try again.';
  });
}
