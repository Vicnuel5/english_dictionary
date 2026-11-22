import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AddWord } from './add-word';

describe('AddWord', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddWord],
      providers: [provideHttpClient(), provideHttpClientTesting()],
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

  it('should render two inputs and a submit button', async () => {
    const fixture = TestBed.createComponent(AddWord);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('input').length).toBe(2);
    expect(compiled.querySelector('button[type="submit"]')?.textContent).toContain('Add word');
  });

  it('should post the word and translation when the form is submitted', async () => {
    const fixture = TestBed.createComponent(AddWord);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const word = compiled.querySelector<HTMLInputElement>('#word')!;
    const translation = compiled.querySelector<HTMLInputElement>('#translation')!;

    word.value = 'apple';
    word.dispatchEvent(new Event('input'));
    translation.value = 'manzana';
    translation.dispatchEvent(new Event('input'));

    compiled.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    const request = http.expectOne('/api/words');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ word: 'apple', translation: 'manzana' });

    request.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('.status')?.textContent).toContain('Java console');
  });
});
