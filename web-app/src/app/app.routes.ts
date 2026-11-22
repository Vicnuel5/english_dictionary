import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'add' },
  {
    path: 'add',
    title: 'Add word · English Dictionary',
    loadComponent: () => import('./features/add-word/add-word').then((m) => m.AddWord),
  },
  {
    path: 'search',
    title: 'Search · English Dictionary',
    loadComponent: () => import('./features/search/search').then((m) => m.Search),
  },
  { path: '**', redirectTo: 'add' },
];
