import { Component, inject, signal } from '@angular/core';
import { WordRequestDTO } from '../../core/models/word-request-dto';
import { DictionaryApi } from '../../core/services/dictionary-api';

@Component({
  selector: 'app-add-word',
  styleUrl: './add-word.css',
  templateUrl: './add-word.html',
})
export class AddWord {
  private readonly api = inject(DictionaryApi);

  protected readonly word = signal('');
  protected readonly translation = signal('');
  protected readonly status = signal('');
  protected readonly statusError = signal(false);
  protected readonly loading = signal(false);

  protected onWordInput(event: Event): void {
    this.word.set((event.target as HTMLInputElement).value);
    this.clearStatus();
  }

  protected onTranslationInput(event: Event): void {
    this.translation.set((event.target as HTMLInputElement).value);
    this.clearStatus();
  }

  protected addWord(event: Event): void {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    const word = this.word().trim();
    const translation = this.translation().trim();

    if (!word || !translation) {
      this.statusError.set(true);
      this.status.set('Word and translation are required.');
      return;
    }

    const request: WordRequestDTO = { word, translation };

    this.statusError.set(false);
    this.loading.set(true);
    this.status.set('Sending to the server...');

    this.api.addWord(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.status.set('Word sent. Check the Java console.');
        this.word.set('');
        this.translation.set('');
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.statusError.set(true);
        this.status.set('Could not reach the server.');
        console.error('[dictionary] add word request failed:', error);
      },
    });
  }

  private clearStatus(): void {
    this.status.set('');
    this.statusError.set(false);
  }
}
