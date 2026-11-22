import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { WordType } from '../../core/models/word-type';
import { WordTypeRequestDTO } from '../../core/models/word-type-request-dto';
import { DictionaryApi } from '../../core/services/dictionary-api';

@Component({
  selector: 'app-word-types',
  styleUrl: './word-types.css',
  templateUrl: './word-types.html',
})
export class WordTypes implements OnInit {
  private readonly api = inject(DictionaryApi);

  protected readonly wordTypes = signal<WordType[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  protected readonly formOpen = signal(false);
  protected readonly newWordType = signal('');
  protected readonly saving = signal(false);
  protected readonly status = signal('');
  protected readonly statusError = signal(false);

  ngOnInit(): void {
    this.loadWordTypes();
  }

  protected toggleForm(): void {
    this.formOpen.update((open) => !open);
    this.newWordType.set('');
    this.clearStatus();
  }

  protected onWordTypeInput(event: Event): void {
    this.newWordType.set((event.target as HTMLInputElement).value);
    this.clearStatus();
  }

  protected addWordType(event: Event): void {
    event.preventDefault();

    if (this.saving()) {
      return;
    }

    const wordType = this.newWordType().trim();

    if (!wordType) {
      this.statusError.set(true);
      this.status.set('Word type is required.');
      return;
    }

    const request: WordTypeRequestDTO = { wordType };

    this.clearStatus();
    this.saving.set(true);

    this.api.addWordType(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.newWordType.set('');
        this.status.set('Word type added.');
        this.loadWordTypes();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.statusError.set(true);
        this.status.set(
          error instanceof HttpErrorResponse && error.status === 409
            ? 'That word type already exists.'
            : 'Could not add the word type.',
        );
        console.error('[dictionary] add word type request failed:', error);
      },
    });
  }

  private loadWordTypes(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.api.getWordTypes().subscribe({
      next: (wordTypes) => {
        this.wordTypes.set(wordTypes);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.wordTypes.set([]);
        this.loading.set(false);
        this.loadError.set(true);
        console.error('[dictionary] load word types request failed:', error);
      },
    });
  }

  private clearStatus(): void {
    this.status.set('');
    this.statusError.set(false);
  }
}
