import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../core/services/notification';
import { Search } from './search';

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
    notifications.notifications().forEach((notification) => notifications.dismiss(notification.id));
    http.verify();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Search);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the search box', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#query')).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')?.textContent).toContain('Search');
  });

  it('should request matches from the backend and render them', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector<HTMLInputElement>('#query')!;

    input.value = 'app';
    input.dispatchEvent(new Event('input'));

    compiled.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    const request = http.expectOne(
      (req) => req.url === '/api/words' && req.params.get('q') === 'app',
    );

    expect(request.request.method).toBe('GET');

    request.flush([
      { word: 'apple', translation: 'manzana' },
      { word: 'application', translation: 'aplicación' },
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    const rows = compiled.querySelectorAll('tbody tr');

    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('apple');
    expect(rows[1].textContent).toContain('application');
  });

  it('should show an empty state when nothing matches', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector<HTMLInputElement>('#query')!;

    input.value = 'zzz';
    input.dispatchEvent(new Event('input'));

    compiled.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    const request = http.expectOne(
      (req) => req.url === '/api/words' && req.params.get('q') === 'zzz',
    );

    request.flush([]);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('.empty')?.textContent).toContain('zzz');
    expect(compiled.querySelectorAll('tbody tr').length).toBe(0);
  });

  it('should show an error notification when the backend fails', async () => {
    const fixture = TestBed.createComponent(Search);
    await fixture.whenStable();

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
});
