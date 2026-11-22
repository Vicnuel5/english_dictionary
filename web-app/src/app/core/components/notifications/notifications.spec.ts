import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NotificationService } from '../../services/notification';
import { Notifications } from './notifications';

describe('Notifications', () => {
  let notifications: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Notifications],
    }).compileComponents();

    notifications = TestBed.inject(NotificationService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render success notifications in green and dismiss them automatically', () => {
    const fixture = TestBed.createComponent(Notifications);
    fixture.detectChanges();

    notifications.success('Word added.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.notification--success')?.textContent).toContain('Word added.');
    expect(compiled.querySelector('.notification--error')).toBeNull();

    vi.advanceTimersByTime(4999);
    fixture.detectChanges();

    expect(compiled.querySelector('.notification')).not.toBeNull();

    vi.advanceTimersByTime(1);
    fixture.detectChanges();

    expect(compiled.querySelector('.notification')).toBeNull();
  });

  it('should render error notifications in red and keep them until closed', () => {
    const fixture = TestBed.createComponent(Notifications);
    fixture.detectChanges();

    notifications.error('Could not add the word.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.notification--error')?.textContent).toContain(
      'Could not add the word.',
    );
    expect(compiled.querySelector('.notification--success')).toBeNull();

    vi.advanceTimersByTime(10000);
    fixture.detectChanges();

    expect(compiled.querySelector('.notification')).not.toBeNull();

    compiled.querySelector<HTMLButtonElement>('.close')!.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.notification')).toBeNull();
  });
});
