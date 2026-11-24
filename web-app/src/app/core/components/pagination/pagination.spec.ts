import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagination],
    }).compileComponents();
  });

  function create(page = 0, pageSize = 20, totalElements = 45) {
    const fixture = TestBed.createComponent(Pagination);

    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.componentRef.setInput('totalElements', totalElements);
    fixture.detectChanges();

    return fixture;
  }

  function pageLabels(compiled: HTMLElement): string[] {
    return Array.from(compiled.querySelectorAll<HTMLButtonElement>('.page-number')).map(
      (button) => button.textContent?.trim() ?? '',
    );
  }

  it('should render the range and page numbers', () => {
    const fixture = create();
    const compiled = fixture.nativeElement as HTMLElement;
    const active = compiled.querySelector<HTMLButtonElement>('.page-number--active');

    expect(compiled.querySelector('.summary')?.textContent).toContain('Showing 1–20 of 45');
    expect(pageLabels(compiled)).toEqual(['1', '2', '3']);
    expect(active?.textContent?.trim()).toBe('1');
    expect(active?.getAttribute('aria-current')).toBe('page');
  });

  it('should show five page numbers centered on the current page', () => {
    const fixture = create(10, 20, 460);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(pageLabels(compiled)).toEqual(['9', '10', '11', '12', '13']);
    expect(compiled.querySelector('.page-number--active')?.textContent?.trim()).toBe('11');
  });

  it('should keep the five page numbers within bounds', () => {
    const firstPage = create(0, 20, 460);
    const lastPage = create(22, 20, 460);

    expect(pageLabels(firstPage.nativeElement as HTMLElement)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
    expect(pageLabels(lastPage.nativeElement as HTMLElement)).toEqual([
      '19',
      '20',
      '21',
      '22',
      '23',
    ]);

    firstPage.destroy();
    lastPage.destroy();
  });

  it('should emit the selected page number', () => {
    const fixture = create(0, 20, 100);
    const emittedPages: number[] = [];

    fixture.componentInstance.pageChange.subscribe((page) => emittedPages.push(page));

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll<HTMLButtonElement>('.page-number');

    expect(pageLabels(compiled)).toEqual(['1', '2', '3', '4', '5']);

    buttons[2].click();
    expect(emittedPages).toEqual([2]);

    buttons[0].click();
    expect(emittedPages).toEqual([2]);
  });

  it('should disable previous controls on the first page and emit the next page', () => {
    const fixture = create();
    const emittedPages: number[] = [];

    fixture.componentInstance.pageChange.subscribe((page) => emittedPages.push(page));

    const compiled = fixture.nativeElement as HTMLElement;
    const previous = compiled.querySelector<HTMLButtonElement>('[aria-label="Previous page"]')!;
    const next = compiled.querySelector<HTMLButtonElement>('[aria-label="Next page"]')!;

    expect(previous.disabled).toBe(true);

    next.click();

    expect(emittedPages).toEqual([1]);
  });

  it('should emit the selected page size', () => {
    const fixture = create();
    const emittedSizes: number[] = [];

    fixture.componentInstance.pageSizeChange.subscribe((size) => emittedSizes.push(size));

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector<HTMLSelectElement>('.page-size-select')!;

    select.value = '50';
    select.dispatchEvent(new Event('change'));

    expect(emittedSizes).toEqual([50]);
  });
});
