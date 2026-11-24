import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DictionaryEntry } from '../../core/models/dictionary-entry';
import { PageResponse } from '../../core/models/page-response';
import { WordType } from '../../core/models/word-type';
import { NotificationService } from '../../core/services/notification';
import { Search } from './search';

const wordEntries: DictionaryEntry[] = [
  { id: 1, word: 'apple', translation: 'manzana', wordTypeId: 1, wordType: 'noun' },
  { id: 2, word: 'application', translation: 'aplicación', wordTypeId: 1, wordType: 'noun' },
];

const secondPageEntries: DictionaryEntry[] = [
  { id: 3, word: 'banana', translation: 'plátano', wordTypeId: 1, wordType: 'noun' },
  { id: 4, word: 'book', translation: 'libro', wordTypeId: 1, wordType: 'noun' },
  { id: 5, word: 'car', translation: 'coche', wordTypeId: 1, wordType: 'noun' },
  { id: 6, word: 'house', translation: 'casa', wordTypeId: 1, wordType: 'noun' },
  { id: 7, word: 'tree', translation: 'árbol', wordTypeId: 1, wordType: 'noun' },
];

const wordTypeOptions: WordType[] = [
  { id: 1, wordType: 'noun' },
  { id: 2, wordType: 'verb' },
];

function pageResponse(
  content: DictionaryEntry[],
  page = 0,
  size = 20,
  totalElements = content.length,
): PageResponse<DictionaryEntry> {
  return {
    content,
    page,
    size,
    totalElements,
    totalPages: totalElements === 0 ? 0 : Math.ceil(totalElements / size),
  };
}

describe('Search', () => {
  let http: HttpTestingController;
  let notifications: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Search],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    notifications = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    notifications.notifications().forEach((notification) => notifications.dismiss(notification.id));
    http.verify();
  });

  it('should create the component and request the first page', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    const request = http.expectOne((req) => req.url === '/api/words');

    expect(request.request.params.get('q')).toBe('');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('20');

    request.flush(pageResponse([]));

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the search box', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    http.expectOne((req) => req.url === '/api/words').flush(pageResponse([]));

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#query')).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')?.textContent).toContain('Search');
  });

  it('should load the first page of all words on page load', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    const request = http.expectOne(
      (req) =>
        req.url === '/api/words' &&
        req.params.get('q') === '' &&
        req.params.get('page') === '0' &&
        req.params.get('size') === '20',
    );

    expect(request.request.method).toBe('GET');

    request.flush(pageResponse(wordEntries, 0, 20, 45));

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');

    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('apple');
    expect(rows[0].textContent).toContain('manzana');
    expect(rows[0].textContent).toContain('noun');
    expect(rows[1].textContent).toContain('application');
    expect(compiled.querySelector('.summary')?.textContent).toContain('Showing 1–20 of 45');
    expect(
      Array.from(compiled.querySelectorAll<HTMLButtonElement>('.page-number')).map((button) =>
        button.textContent?.trim(),
      ),
    ).toEqual(['1', '2', '3']);
    expect(compiled.querySelector('.page-number--active')?.textContent).toContain('1');
  });

  it('should request matches from the backend and render them', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    http.expectOne((req) => req.url === '/api/words').flush(pageResponse([]));

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector<HTMLInputElement>('#query')!;

    input.value = 'app';
    input.dispatchEvent(new Event('input'));

    compiled.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    const request = http.expectOne(
      (req) =>
        req.url === '/api/words' &&
        req.params.get('q') === 'app' &&
        req.params.get('page') === '0' &&
        req.params.get('size') === '20',
    );

    expect(request.request.method).toBe('GET');

    request.flush(pageResponse(wordEntries, 0, 20, 2));

    fixture.detectChanges();
    await fixture.whenStable();

    const rows = compiled.querySelectorAll('tbody tr');

    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('apple');
    expect(rows[0].textContent).toContain('manzana');
    expect(rows[0].textContent).toContain('noun');
    expect(rows[1].textContent).toContain('application');
  });

  it('should show an empty state when nothing matches', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    http.expectOne((req) => req.url === '/api/words').flush(pageResponse([]));

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector<HTMLInputElement>('#query')!;

    input.value = 'zzz';
    input.dispatchEvent(new Event('input'));

    compiled.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    const request = http.expectOne(
      (req) => req.url === '/api/words' && req.params.get('q') === 'zzz',
    );

    request.flush(pageResponse([], 0, 20, 0));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('.empty')?.textContent).toContain('zzz');
    expect(compiled.querySelectorAll('tbody tr').length).toBe(0);
  });

  it('should show an error notification when the backend fails', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    http.expectOne((req) => req.url === '/api/words').flush(pageResponse([]));

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector<HTMLInputElement>('#query')!;

    input.value = 'house';
    input.dispatchEvent(new Event('input'));

    compiled.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    const request = http.expectOne(
      (req) => req.url === '/api/words' && req.params.get('q') === 'house',
    );

    request.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(notifications.notifications()).toContainEqual(
      expect.objectContaining({ type: 'error', message: 'Could not search words.' }),
    );
    expect(compiled.querySelector('.empty')).toBeNull();
  });

  it('should request and render the next page', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    http
      .expectOne((req) => req.url === '/api/words')
      .flush(pageResponse(wordEntries, 0, 20, 45));

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('[aria-label="Next page"]')!.click();

    const request = http.expectOne(
      (req) =>
        req.url === '/api/words' &&
        req.params.get('q') === '' &&
        req.params.get('page') === '1' &&
        req.params.get('size') === '20',
    );

    request.flush(pageResponse(secondPageEntries, 1, 20, 45));

    fixture.detectChanges();
    await fixture.whenStable();

    const rows = compiled.querySelectorAll('tbody tr');

    expect(rows.length).toBe(5);
    expect(rows[0].textContent).toContain('banana');
    expect(compiled.querySelector('.summary')?.textContent).toContain('Showing 21–40 of 45');
    expect(compiled.querySelector('.page-number--active')?.textContent).toContain('2');
  });

  it('should reset to the first page when the page size changes', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    http
      .expectOne((req) => req.url === '/api/words')
      .flush(pageResponse(wordEntries, 0, 20, 45));

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const pageSize = compiled.querySelector<HTMLSelectElement>('.page-size-select')!;

    pageSize.value = '50';
    pageSize.dispatchEvent(new Event('change'));

    const request = http.expectOne(
      (req) =>
        req.url === '/api/words' &&
        req.params.get('q') === '' &&
        req.params.get('page') === '0' &&
        req.params.get('size') === '50',
    );

    request.flush(pageResponse(wordEntries, 0, 50, 45));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('.summary')?.textContent).toContain('Showing 1–45 of 45');
    expect(compiled.querySelectorAll('.page-number').length).toBe(1);
    expect(compiled.querySelector('.page-number--active')?.textContent).toContain('1');
    expect(pageSize.value).toBe('50');
  });

  it('should edit a word and reload the current page', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    http
      .expectOne((req) => req.url === '/api/words')
      .flush(pageResponse(wordEntries, 0, 20, 45));

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const firstRow = compiled.querySelector<HTMLElement>('tbody tr')!;

    firstRow.querySelector<HTMLButtonElement>('.action')!.click();
    fixture.detectChanges();

    http.expectOne('/api/word-types').flush(wordTypeOptions);

    fixture.detectChanges();
    await fixture.whenStable();

    const wordInput = compiled.querySelector<HTMLInputElement>('#edit-word-1')!;
    const translationInput = compiled.querySelector<HTMLInputElement>('#edit-translation-1')!;
    const typeSelect = compiled.querySelector<HTMLSelectElement>('#edit-type-1')!;

    expect(wordInput.value).toBe('apple');
    expect(translationInput.value).toBe('manzana');
    expect(typeSelect.value).toBe('1');

    wordInput.value = 'apricot';
    wordInput.dispatchEvent(new Event('input'));
    translationInput.value = 'albaricoque';
    translationInput.dispatchEvent(new Event('input'));
    typeSelect.value = '2';
    typeSelect.dispatchEvent(new Event('change'));

    compiled
      .querySelector<HTMLFormElement>('.edit-form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));

    const put = http.expectOne('/api/words/1');

    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({
      word: 'apricot',
      translation: 'albaricoque',
      wordTypeId: 2,
    });

    put.flush(null, { status: 204, statusText: 'No Content' });

    fixture.detectChanges();
    await fixture.whenStable();

    const reload = http.expectOne(
      (req) =>
        req.url === '/api/words' &&
        req.params.get('q') === '' &&
        req.params.get('page') === '0' &&
        req.params.get('size') === '20',
    );

    reload.flush(
      pageResponse(
        [
          {
            id: 1,
            word: 'apricot',
            translation: 'albaricoque',
            wordTypeId: 2,
            wordType: 'verb',
          },
          wordEntries[1],
        ],
        0,
        20,
        45,
      ),
    );

    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('tbody tr')?.textContent).toContain('apricot');
    expect(notifications.notifications()).toContainEqual(
      expect.objectContaining({ type: 'success', message: 'Word updated.' }),
    );
  });

  it('should delete a word and reload the current page', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    http
      .expectOne((req) => req.url === '/api/words')
      .flush(pageResponse(wordEntries, 0, 20, 45));

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const firstRow = compiled.querySelector<HTMLElement>('tbody tr')!;

    firstRow.querySelectorAll<HTMLButtonElement>('.action')[1].click();

    const remove = http.expectOne('/api/words/1');

    expect(remove.request.method).toBe('DELETE');

    remove.flush(null, { status: 204, statusText: 'No Content' });

    fixture.detectChanges();
    await fixture.whenStable();

    const reload = http.expectOne(
      (req) =>
        req.url === '/api/words' &&
        req.params.get('q') === '' &&
        req.params.get('page') === '0' &&
        req.params.get('size') === '20',
    );

    reload.flush(pageResponse([wordEntries[1]], 0, 20, 44));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelectorAll('tbody tr').length).toBe(1);
    expect(compiled.querySelector('tbody tr')?.textContent).toContain('application');
    expect(notifications.notifications()).toContainEqual(
      expect.objectContaining({ type: 'success', message: 'Word deleted.' }),
    );
  });

  it('should go back a page when deleting the last word on the current page', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    http
      .expectOne((req) => req.url === '/api/words')
      .flush(pageResponse(wordEntries, 0, 20, 21));

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('[aria-label="Next page"]')!.click();

    http
      .expectOne(
        (req) => req.url === '/api/words' && req.params.get('page') === '1',
      )
      .flush(pageResponse([secondPageEntries[0]], 1, 20, 21));

    fixture.detectChanges();
    await fixture.whenStable();

    const firstRow = compiled.querySelector<HTMLElement>('tbody tr')!;

    firstRow.querySelectorAll<HTMLButtonElement>('.action')[1].click();

    http
      .expectOne('/api/words/3')
      .flush(null, { status: 204, statusText: 'No Content' });

    fixture.detectChanges();
    await fixture.whenStable();

    http
      .expectOne(
        (req) => req.url === '/api/words' && req.params.get('page') === '1',
      )
      .flush(pageResponse([], 1, 20, 20));

    fixture.detectChanges();
    await fixture.whenStable();

    http
      .expectOne(
        (req) => req.url === '/api/words' && req.params.get('page') === '0',
      )
      .flush(pageResponse(wordEntries, 0, 20, 20));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('.page-number--active')?.textContent).toContain('1');
    expect(notifications.notifications()).toContainEqual(
      expect.objectContaining({ type: 'success', message: 'Word deleted.' }),
    );
  });
});
