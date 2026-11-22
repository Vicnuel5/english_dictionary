import { Component, inject, signal } from '@angular/core';
import { DictionaryEntry } from '../../core/models/dictionary-entry';
import { DictionaryApi } from '../../core/services/dictionary-api';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-search',
  styleUrl: './search.css',
  templateUrl: './search.html',
})
export class Search {
  private readonly api = inject(DictionaryApi);
  private readonly notificationService = inject(NotificationService);

  protected readonly query = signal('');
  protected readonly submittedQuery = signal('');
  protected readonly results = signal<DictionaryEntry[]>([]);
  protected readonly searched = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.error.set(false);
  }

  protected search(event: Event): void {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    const submitted = this.query().trim();

    if (!submitted) {
      this.results.set([]);
      this.submittedQuery.set('');
      this.searched.set(false);
      this.error.set(false);
      return;
    }

    this.submittedQuery.set(submitted);
    this.loading.set(true);
    this.error.set(false);

    this.api.searchWords(submitted).subscribe({
      next: (entries) => {
        this.results.set(entries);
        this.searched.set(true);
        this.loading.set(false);
      },
      error: (requestError: unknown) => {
        this.results.set([]);
        this.searched.set(false);
        this.loading.set(false);
        this.error.set(true);
        this.notificationService.error('Could not search words.');
        console.error('[dictionary] search request failed:', requestError);
      },
    });
  }
}
