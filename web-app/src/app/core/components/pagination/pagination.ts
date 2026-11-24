import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  styleUrl: './pagination.css',
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalElements = input.required<number>();
  readonly pageSizeOptions = input<number[]>([20, 50, 100]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalElements() / this.pageSize())),
  );

  protected readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const windowSize = Math.min(5, total);
    const current = Math.min(Math.max(this.page(), 0), total - 1);
    const start = Math.min(
      Math.max(current - Math.floor(windowSize / 2), 0),
      total - windowSize,
    );

    return Array.from({ length: windowSize }, (_, index) => start + index);
  });

  protected readonly firstItem = computed(() =>
    this.totalElements() === 0 ? 0 : this.page() * this.pageSize() + 1,
  );

  protected readonly lastItem = computed(() =>
    Math.min((this.page() + 1) * this.pageSize(), this.totalElements()),
  );

  protected goTo(page: number): void {
    const target = Math.min(Math.max(page, 0), this.totalPages() - 1);

    if (target !== this.page()) {
      this.pageChange.emit(target);
    }
  }

  protected onPageSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);

    if (size !== this.pageSize()) {
      this.pageSizeChange.emit(size);
    }
  }
}
