import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { WordRequestDTO } from '../../core/models/word-request-dto';
import { WordType } from '../../core/models/word-type';
import { DictionaryApi } from '../../core/services/dictionary-api';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-add-word',
  styleUrl: './add-word.css',
  templateUrl: './add-word.html',
})
export class AddWord implements OnInit {
  private readonly api = inject(DictionaryApi);
  private readonly notificationService = inject(NotificationService);

  protected readonly word = signal('');
  protected readonly translation = signal('');
  protected readonly wordTypeId = signal<number | null>(null);
  protected readonly wordTypes = signal<WordType[]>([]);
  protected readonly typesLoading = signal(true);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.loadWordTypes();
  }

  protected onWordInput(event: Event): void {
    this.word.set((event.target as HTMLInputElement).value);
  }

  protected onTranslationInput(event: Event): void {
    this.translation.set((event.target as HTMLInputElement).value);
  }

  protected onWordTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.wordTypeId.set(value ? Number(value) : null);
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
      this.notificationService.error('Word, translation and word type are required.');
      return;
    }

    const request: WordRequestDTO = { word, translation, wordTypeId };

    this.loading.set(true);

    this.api.addWord(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.notificationService.success('Word added.');
        this.word.set('');
        this.translation.set('');
        this.wordTypeId.set(null);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.notificationService.error(
          error instanceof HttpErrorResponse && error.status === 400
            ? 'The selected word type is not valid.'
            : 'Could not add the word.',
        );
        console.error('[dictionary] add word request failed:', error);
      },
    });
  }

  private loadWordTypes(): void {
    this.typesLoading.set(true);

    this.api.getWordTypes().subscribe({
      next: (wordTypes) => {
        this.wordTypes.set(wordTypes);
        this.typesLoading.set(false);

        if (!wordTypes.length) {
          this.notificationService.error(
            'No word types available. Add one in the Word types tab.',
          );
        }
      },
      error: (error: unknown) => {
        this.wordTypes.set([]);
        this.typesLoading.set(false);
        this.notificationService.error('Could not load word types.');
        console.error('[dictionary] load word types request failed:', error);
      },
    });
  }
}
