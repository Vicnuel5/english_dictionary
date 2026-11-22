import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WordTypes } from './word-types';

describe('WordTypes', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordTypes],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
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
    expect(compiled.querySelector('.status')?.textContent).toContain('Word type added');
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

    expect(compiled.querySelector('.status')?.textContent).toContain('already exists');
  });
});
