import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shelf-lookup/shelf-lookup').then((m) => m.ShelfLookup),
  },
  {
    path: 'shelf/:userId',
    loadComponent: () => import('./shelf-page/shelf-page').then((m) => m.ShelfPage),
    children: [
      {
        path: 'book/:bookId',
        loadComponent: () => import('./book-view/book-view').then((m) => m.BookView),
      },
    ],
  },
];
