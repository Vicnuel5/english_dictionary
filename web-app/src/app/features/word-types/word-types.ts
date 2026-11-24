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

  protected readonly editingId = signal<number | null>(null);
  protected readonly editName = signal('');
  protected readonly updating = signal(false);
  protected readonly deletingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadWordTypes();
  }

  protected toggleForm(): void {
    this.formOpen.update((open) => !open);
    this.newWordType.set('');

    if (this.formOpen()) {
      this.editingId.set(null);
      this.editName.set('');
    }
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

  protected startEdit(wordType: WordType): void {
    if (this.updating() || this.deletingId() !== null) {
      return;
    }

    this.formOpen.set(false);
    this.newWordType.set('');
    this.editingId.set(wordType.id);
    this.editName.set(wordType.wordType);
  }

  protected cancelEdit(): void {
    if (this.updating()) {
      return;
    }

    this.editingId.set(null);
    this.editName.set('');
  }

  protected onEditInput(event: Event): void {
    this.editName.set((event.target as HTMLInputElement).value);
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

    const wordType = this.editName().trim();

    if (!wordType) {
      this.notificationService.error('Word type is required.');
      return;
    }

    const request: WordTypeRequestDTO = { wordType };

    this.updating.set(true);

    this.api.updateWordType(id, request).subscribe({
      next: () => {
        this.updating.set(false);
        this.editingId.set(null);
        this.editName.set('');
        this.notificationService.success('Word type updated.');
        this.loadWordTypes();
      },
      error: (error: unknown) => {
        this.updating.set(false);

        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.notificationService.error('That word type already exists.');
        } else if (error instanceof HttpErrorResponse && error.status === 404) {
          this.notificationService.error('Word type not found.');
        } else {
          this.notificationService.error('Could not update the word type.');
        }

        console.error('[dictionary] update word type request failed:', error);
      },
    });
  }

  protected deleteWordType(wordType: WordType): void {
    if (this.updating() || this.deletingId() !== null) {
      return;
    }

    const confirmed = window.confirm(`Delete the word type "${wordType.wordType}"?`);

    if (!confirmed) {
      return;
    }

    this.deletingId.set(wordType.id);

    this.api.deleteWordType(wordType.id).subscribe({
      next: () => {
        this.deletingId.set(null);

        if (this.editingId() === wordType.id) {
          this.editingId.set(null);
          this.editName.set('');
        }

        this.notificationService.success('Word type deleted.');
        this.loadWordTypes();
      },
      error: (error: unknown) => {
        this.deletingId.set(null);

        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.notificationService.error(
            'This word type is used by at least one word and cannot be deleted.',
          );
        } else if (error instanceof HttpErrorResponse && error.status === 404) {
          this.notificationService.error('Word type not found.');
        } else {
          this.notificationService.error('Could not delete the word type.');
        }

        console.error('[dictionary] delete word type request failed:', error);
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
