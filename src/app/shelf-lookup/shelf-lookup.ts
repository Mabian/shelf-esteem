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
