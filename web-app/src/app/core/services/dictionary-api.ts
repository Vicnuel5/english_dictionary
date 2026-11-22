import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DictionaryEntry } from '../models/dictionary-entry';
import { WordRequestDTO } from '../models/word-request-dto';

/**
 * Single place for every HTTP call to the backend.
 *
 * `providedIn: 'root'` makes Angular create one instance for the whole
 * application (a singleton), shared by every component that injects it.
 */
@Injectable({ providedIn: 'root' })
export class DictionaryApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  addWord(request: WordRequestDTO): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/words`, request);
  }

  searchWords(query: string): Observable<DictionaryEntry[]> {
    return this.http.get<DictionaryEntry[]>(`${this.baseUrl}/words`, {
      params: { q: query },
    });
  }
}
