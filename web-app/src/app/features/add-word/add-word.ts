import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WordRequestDTO } from '../../core/models/word-request-dto';
import { WordType } from '../../core/models/word-type';
import { DictionaryApi } from '../../core/services/dictionary-api';

@Component({
  selector: 'app-add-word',
  imports: [RouterLink],
  styleUrl: './add-word.css',
  templateUrl: './add-word.html',
})
export class AddWord implements OnInit {
  private readonly api = inject(DictionaryApi);

  protected readonly word = signal('');
  protected readonly translation = signal('');
  protected readonly wordTypeId = signal<number | null>(null);
  protected readonly wordTypes = signal<WordType[]>([]);
  protected readonly typesLoading = signal(true);
  protected readonly typesError = signal(false);
  protected readonly status = signal('');
  protected readonly statusError = signal(false);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.loadWordTypes();
  }

  protected onWordInput(event: Event): void {
    this.word.set((event.target as HTMLInputElement).value);
    this.clearStatus();
  }

  protected onTranslationInput(event: Event): void {
    this.translation.set((event.target as HTMLInputElement).value);
    this.clearStatus();
  }

  protected onWordTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.wordTypeId.set(value ? Number(value) : null);
    this.clearStatus();
  }

  protected addWord(event: Event): void {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    const word = this.word().trim();
    const translation = this.translation().trim();
    const wordTypeId = this.wordTypeId();

    if (!word || !translation || wordTypeId === null) {
      this.statusError.set(true);
      this.status.set('Word, translation and word type are required.');
      return;
    }

    const request: WordRequestDTO = { word, translation, wordTypeId };

    this.statusError.set(false);
    this.loading.set(true);
    this.status.set('Sending to the server...');

    this.api.addWord(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.status.set('Word added.');
        this.word.set('');
        this.translation.set('');
        this.wordTypeId.set(null);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.statusError.set(true);
        this.status.set(
          error instanceof HttpErrorResponse && error.status === 400
            ? 'The selected word type is not valid.'
            : 'Could not reach the server.',
        );
        console.error('[dictionary] add word request failed:', error);
      },
    });
  }

  private loadWordTypes(): void {
    this.typesLoading.set(true);
    this.typesError.set(false);

    this.api.getWordTypes().subscribe({
      next: (wordTypes) => {
        this.wordTypes.set(wordTypes);
        this.typesLoading.set(false);
      },
      error: (error: unknown) => {
        this.wordTypes.set([]);
        this.typesLoading.set(false);
        this.typesError.set(true);
        console.error('[dictionary] load word types request failed:', error);
      },
    });
  }

  private clearStatus(): void {
    this.status.set('');
    this.statusError.set(false);
  }
}
