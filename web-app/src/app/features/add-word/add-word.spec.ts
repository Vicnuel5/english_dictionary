import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AddWord } from './add-word';

describe('AddWord', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddWord],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AddWord);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render two inputs, a word type select and a submit button', async () => {
    const fixture = TestBed.createComponent(AddWord);
    await fixture.whenStable();

    http.expectOne('/api/word-types').flush([]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('input').length).toBe(2);
    expect(compiled.querySelector('#wordType')).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')?.textContent).toContain('Add word');
  });

  it('should load the word types into the select', async () => {
    const fixture = TestBed.createComponent(AddWord);
    await fixture.whenStable();

    http.expectOne('/api/word-types').flush([
      { id: 1, wordType: 'noun' },
      { id: 2, wordType: 'verb' },
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector<HTMLSelectElement>('#wordType')!;

    expect(select.disabled).toBe(false);
    expect(select.options.length).toBe(3);
    expect(select.options[1].textContent).toContain('noun');
    expect(select.options[2].textContent).toContain('verb');
  });

  it('should post the word, translation and word type when the form is submitted', async () => {
    const fixture = TestBed.createComponent(AddWord);
    await fixture.whenStable();

    http.expectOne('/api/word-types').flush([
      { id: 1, wordType: 'noun' },
      { id: 2, wordType: 'verb' },
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const word = compiled.querySelector<HTMLInputElement>('#word')!;
    const translation = compiled.querySelector<HTMLInputElement>('#translation')!;
    const wordType = compiled.querySelector<HTMLSelectElement>('#wordType')!;

    word.value = 'apple';
    word.dispatchEvent(new Event('input'));
    translation.value = 'manzana';
    translation.dispatchEvent(new Event('input'));
    wordType.value = '2';
    wordType.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    compiled.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    const request = http.expectOne('/api/words');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      word: 'apple',
      translation: 'manzana',
      wordTypeId: 2,
    });

    request.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('.status')?.textContent).toContain('Word added');
    expect(wordType.value).toBe('');
  });
});
