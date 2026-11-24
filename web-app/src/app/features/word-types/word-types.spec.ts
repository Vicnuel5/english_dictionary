import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NotificationService } from '../../core/services/notification';
import { WordTypes } from './word-types';

describe('WordTypes', () => {
  let http: HttpTestingController;
  let notifications: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordTypes],
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

  it('should create the component', () => {
    const fixture = TestBed.createComponent(WordTypes);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load and render the word types on init', async () => {
    const fixture = TestBed.createComponent(WordTypes);
    await fixture.whenStable();

    const request = http.expectOne('/api/word-types');
    expect(request.request.method).toBe('GET');

    request.flush([
      { id: 1, wordType: 'noun' },
      { id: 2, wordType: 'verb' },
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');

    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('noun');
    expect(rows[1].textContent).toContain('verb');
  });

  it('should show an empty state when there are no word types', async () => {
    const fixture = TestBed.createComponent(WordTypes);
    await fixture.whenStable();

    http.expectOne('/api/word-types').flush([]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.empty')?.textContent).toContain('No word types yet');
  });

  it('should post a new word type and reload the list', async () => {
    const fixture = TestBed.createComponent(WordTypes);
    await fixture.whenStable();

    http.expectOne('/api/word-types').flush([]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.page-header button')!.click();
    fixture.detectChanges();

    const input = compiled.querySelector<HTMLInputElement>('#wordType')!;
    input.value = 'adjective';
    input.dispatchEvent(new Event('input'));

    compiled.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    const post = http.expectOne('/api/word-types');

    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ wordType: 'adjective' });

    post.flush(null, { status: 204, statusText: 'No Content' });

    fixture.detectChanges();
    await fixture.whenStable();

    const reload = http.expectOne('/api/word-types');
    expect(reload.request.method).toBe('GET');

    reload.flush([{ id: 3, wordType: 'adjective' }]);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('tbody tr')?.textContent).toContain('adjective');
    expect(notifications.notifications()).toContainEqual(
      expect.objectContaining({ type: 'success', message: 'Word type added.' }),
    );
  });

  it('should show an error when the word type already exists', async () => {
    const fixture = TestBed.createComponent(WordTypes);
    await fixture.whenStable();

    http.expectOne('/api/word-types').flush([]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.page-header button')!.click();
    fixture.detectChanges();

    const input = compiled.querySelector<HTMLInputElement>('#wordType')!;
    input.value = 'noun';
    input.dispatchEvent(new Event('input'));

    compiled.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    const post = http.expectOne('/api/word-types');
    post.flush(null, { status: 409, statusText: 'Conflict' });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(notifications.notifications()).toContainEqual(
      expect.objectContaining({ type: 'error', message: 'That word type already exists.' }),
    );
  });

  it('should update a word type and reload the list', async () => {
    const fixture = TestBed.createComponent(WordTypes);
    await fixture.whenStable();

    http.expectOne('/api/word-types').flush([
      { id: 1, wordType: 'noun' },
      { id: 2, wordType: 'verb' },
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const firstRow = compiled.querySelector<HTMLElement>('tbody tr')!;

    firstRow.querySelector<HTMLButtonElement>('.action')!.click();
    fixture.detectChanges();

    const input = compiled.querySelector<HTMLInputElement>('#edit-1')!;
    expect(input.value).toBe('noun');

    input.value = 'Noun phrase';
    input.dispatchEvent(new Event('input'));

    compiled
      .querySelector<HTMLFormElement>('.edit-form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));

    const put = http.expectOne('/api/word-types/1');

    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ wordType: 'Noun phrase' });

    put.flush(null, { status: 204, statusText: 'No Content' });

    fixture.detectChanges();
    await fixture.whenStable();

    const reload = http.expectOne('/api/word-types');
    reload.flush([
      { id: 1, wordType: 'Noun phrase' },
      { id: 2, wordType: 'verb' },
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('tbody tr')?.textContent).toContain('Noun phrase');
    expect(notifications.notifications()).toContainEqual(
      expect.objectContaining({ type: 'success', message: 'Word type updated.' }),
    );
  });

  it('should show an error when editing to an existing word type', async () => {
    const fixture = TestBed.createComponent(WordTypes);
    await fixture.whenStable();

    http.expectOne('/api/word-types').flush([
      { id: 1, wordType: 'noun' },
      { id: 2, wordType: 'verb' },
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const firstRow = compiled.querySelector<HTMLElement>('tbody tr')!;

    firstRow.querySelector<HTMLButtonElement>('.action')!.click();
    fixture.detectChanges();

    const input = compiled.querySelector<HTMLInputElement>('#edit-1')!;
    input.value = 'verb';
    input.dispatchEvent(new Event('input'));

    compiled
      .querySelector<HTMLFormElement>('.edit-form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));

    http
      .expectOne('/api/word-types/1')
      .flush(null, { status: 409, statusText: 'Conflict' });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(notifications.notifications()).toContainEqual(
      expect.objectContaining({ type: 'error', message: 'That word type already exists.' }),
    );
    expect(compiled.querySelector('#edit-1')).not.toBeNull();
  });

  it('should delete a word type and reload the list', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const fixture = TestBed.createComponent(WordTypes);
    await fixture.whenStable();

    http.expectOne('/api/word-types').flush([
      { id: 1, wordType: 'noun' },
      { id: 2, wordType: 'verb' },
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const firstRow = compiled.querySelector<HTMLElement>('tbody tr')!;

    firstRow.querySelectorAll<HTMLButtonElement>('.action')[1].click();
    fixture.detectChanges();

    const remove = http.expectOne('/api/word-types/1');

    expect(remove.request.method).toBe('DELETE');

    remove.flush(null, { status: 204, statusText: 'No Content' });

    fixture.detectChanges();
    await fixture.whenStable();

    const reload = http.expectOne('/api/word-types');
    reload.flush([{ id: 2, wordType: 'verb' }]);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelectorAll('tbody tr').length).toBe(1);
    expect(notifications.notifications()).toContainEqual(
      expect.objectContaining({ type: 'success', message: 'Word type deleted.' }),
    );
  });

  it('should not delete a word type that is in use', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const fixture = TestBed.createComponent(WordTypes);
    await fixture.whenStable();

    http.expectOne('/api/word-types').flush([{ id: 1, wordType: 'noun' }]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const firstRow = compiled.querySelector<HTMLElement>('tbody tr')!;

    firstRow.querySelectorAll<HTMLButtonElement>('.action')[1].click();
    fixture.detectChanges();

    http
      .expectOne('/api/word-types/1')
      .flush(null, { status: 409, statusText: 'Conflict' });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(notifications.notifications()).toContainEqual(
      expect.objectContaining({
        type: 'error',
        message: 'This word type is used by at least one word and cannot be deleted.',
      }),
    );
    expect(compiled.querySelectorAll('tbody tr').length).toBe(1);
  });
});
