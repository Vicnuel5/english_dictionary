import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Pagination } from '../../core/components/pagination/pagination';
import { DictionaryEntry } from '../../core/models/dictionary-entry';
import { WordRequestDTO } from '../../core/models/word-request-dto';
import { WordType } from '../../core/models/word-type';
import { DictionaryApi } from '../../core/services/dictionary-api';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-search',
  imports: [Pagination],
  styleUrl: './search.css',
  templateUrl: './search.html',
})
export class Search implements OnInit {
  private readonly api = inject(DictionaryApi);
  private readonly notificationService = inject(NotificationService);

  protected readonly query = signal('');
  protected readonly submittedQuery = signal('');
  protected readonly results = signal<DictionaryEntry[]>([]);
  protected readonly searched = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly totalElements = signal(0);

  protected readonly wordTypes = signal<WordType[]>([]);
  protected readonly typesLoading = signal(false);

  protected readonly editingId = signal<number | null>(null);
  protected readonly editWord = signal('');
  protected readonly editTranslation = signal('');
  protected readonly editWordTypeId = signal<number | null>(null);
  protected readonly updating = signal(false);
  protected readonly deletingId = signal<number | null>(null);

  ngOnInit(): void {
    // An empty query means "no filter" (wildcard), so the first page loads on page open.
    this.executeSearch('', 0);
  }

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.error.set(false);
  }

  protected search(event: Event): void {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    this.executeSearch(this.query().trim(), 0);
  }

  protected onPageChange(page: number): void {
    if (this.loading()) {
      return;
    }

    this.executeSearch(this.submittedQuery(), page);
  }

  protected onPageSizeChange(size: number): void {
    if (this.loading() || size === this.pageSize()) {
      return;
    }

    this.pageSize.set(size);
    this.executeSearch(this.submittedQuery(), 0);
  }

  protected startEdit(entry: DictionaryEntry): void {
    if (this.updating() || this.deletingId() !== null) {
      return;
    }

    this.editingId.set(entry.id);
    this.editWord.set(entry.word);
    this.editTranslation.set(entry.translation);
    this.editWordTypeId.set(entry.wordTypeId);

    if (!this.wordTypes().length && !this.typesLoading()) {
      this.loadWordTypes();
    }
  }

  protected cancelEdit(): void {
    if (this.updating()) {
      return;
    }

    this.resetEdit();
  }

  protected onEditWordInput(event: Event): void {
    this.editWord.set((event.target as HTMLInputElement).value);
  }

  protected onEditTranslationInput(event: Event): void {
    this.editTranslation.set((event.target as HTMLInputElement).value);
  }

  protected onEditWordTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.editWordTypeId.set(value ? Number(value) : null);
  }

  protected saveEdit(event: Event): void {
    event.preventDefault();

    if (this.updating()) {
      return;
    }

    const id = this.editingId();

    if (id === null) {
      return;
    }

    const word = this.editWord().trim();
    const translation = this.editTranslation().trim();
    const wordTypeId = this.editWordTypeId();

    if (!word || !translation || wordTypeId === null) {
      this.notificationService.error('Word, translation and word type are required.');
      return;
    }

    const request: WordRequestDTO = { word, translation, wordTypeId };

    this.updating.set(true);

    this.api.updateWord(id, request).subscribe({
      next: () => {
        this.updating.set(false);
        this.notificationService.success('Word updated.');
        this.reloadCurrentPage();
      },
      error: (error: unknown) => {
        this.updating.set(false);

        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.notificationService.error('Word not found.');
        } else if (error instanceof HttpErrorResponse && error.status === 400) {
          this.notificationService.error('The selected word type is not valid.');
        } else {
          this.notificationService.error('Could not update the word.');
        }

        console.error('[dictionary] update word request failed:', error);
      },
    });
  }

  protected deleteWord(entry: DictionaryEntry): void {
    if (this.updating() || this.deletingId() !== null) {
      return;
    }

    const confirmed = window.confirm(`Delete the word "${entry.word}"?`);

    if (!confirmed) {
      return;
    }

    this.deletingId.set(entry.id);

    this.api.deleteWord(entry.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.notificationService.success('Word deleted.');
        this.reloadCurrentPage();
      },
      error: (error: unknown) => {
        this.deletingId.set(null);

        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.notificationService.error('Word not found.');
        } else {
          this.notificationService.error('Could not delete the word.');
        }

        console.error('[dictionary] delete word request failed:', error);
      },
    });
  }

  private loadWordTypes(): void {
    this.typesLoading.set(true);

    this.api.getWordTypes().subscribe({
      next: (wordTypes) => {
        this.wordTypes.set(wordTypes);
        this.typesLoading.set(false);
      },
      error: (error: unknown) => {
        this.wordTypes.set([]);
        this.typesLoading.set(false);
        this.notificationService.error('Could not load word types.');
        console.error('[dictionary] load word types request failed:', error);
      },
    });
  }

  private reloadCurrentPage(): void {
    this.executeSearch(this.submittedQuery(), this.page());
  }

  private resetEdit(): void {
    this.editingId.set(null);
    this.editWord.set('');
    this.editTranslation.set('');
    this.editWordTypeId.set(null);
  }

  private executeSearch(query: string, page: number): void {
    this.resetEdit();
    this.submittedQuery.set(query);
    this.loading.set(true);
    this.error.set(false);

    this.api.searchWords(query, page, this.pageSize()).subscribe({
      next: (response) => {
        if (response.content.length === 0 && response.page > 0 && response.totalElements > 0) {
          this.executeSearch(query, response.page - 1);
          return;
        }

        this.results.set(response.content);
        this.page.set(response.page);
        this.pageSize.set(response.size);
        this.totalElements.set(response.totalElements);
        this.searched.set(true);
        this.loading.set(false);
      },
      error: (requestError: unknown) => {
        this.results.set([]);
        this.totalElements.set(0);
        this.searched.set(false);
        this.loading.set(false);
        this.error.set(true);
        this.notificationService.error('Could not search words.');
        console.error('[dictionary] search request failed:', requestError);
      },
    });
  }
}
