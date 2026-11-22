import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { WordType } from '../../core/models/word-type';
import { WordTypeRequestDTO } from '../../core/models/word-type-request-dto';
import { DictionaryApi } from '../../core/services/dictionary-api';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-word-types',
  styleUrl: './word-types.css',
  templateUrl: './word-types.html',
})
export class WordTypes implements OnInit {
  private readonly api = inject(DictionaryApi);
  private readonly notificationService = inject(NotificationService);

  protected readonly wordTypes = signal<WordType[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  protected readonly formOpen = signal(false);
  protected readonly newWordType = signal('');
  protected readonly saving = signal(false);

  ngOnInit(): void {
    this.loadWordTypes();
  }

  protected toggleForm(): void {
    this.formOpen.update((open) => !open);
    this.newWordType.set('');
  }

  protected onWordTypeInput(event: Event): void {
    this.newWordType.set((event.target as HTMLInputElement).value);
  }

  protected addWordType(event: Event): void {
    event.preventDefault();

    if (this.saving()) {
      return;
    }

    const wordType = this.newWordType().trim();

    if (!wordType) {
      this.notificationService.error('Word type is required.');
      return;
    }

    const request: WordTypeRequestDTO = { wordType };

    this.saving.set(true);

    this.api.addWordType(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.newWordType.set('');
        this.notificationService.success('Word type added.');
        this.loadWordTypes();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notificationService.error(
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
        this.notificationService.error('Could not load word types.');
        console.error('[dictionary] load word types request failed:', error);
      },
    });
  }
}
