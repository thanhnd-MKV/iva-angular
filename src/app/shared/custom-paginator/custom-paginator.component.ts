import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-custom-paginator',
  templateUrl: './custom-paginator.component.html',
  styleUrls: ['./custom-paginator.component.css'],
  imports: [CommonModule],
})
export class CustomPaginatorComponent implements OnChanges {
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 0; // page index (bắt đầu từ 0)
  @Output() pageChange = new EventEmitter<number>();

  totalPages = 0;
  pages: (number | '...')[] = [];

  ngOnChanges(): void {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.pages = this.generatePages();
  }

  generatePages(): (number | '...')[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | '...')[] = [];

    if (total <= 6) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      if (current <= 2) {
        pages.push(0, 1, 2, 3, '...', total - 1);
      } else if (current >= total - 3) {
        pages.push(0, '...', total - 4, total - 3, total - 2, total - 1);
      } else {
        pages.push(0, '...', current - 1, current, current + 1, '...', total - 1);
      }
    }

    return pages;
  }

  goToPage(page: number | '...') {
    if (page === '...' || page === this.currentPage) return;

    const targetPage = Math.max(0, Math.min(this.totalPages - 1, page));
    this.pageChange.emit(targetPage);
  }

  next() {
    if (this.currentPage < this.totalPages - 1) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  last() {
    this.pageChange.emit(this.totalPages - 1);
  }

  prev() {
    if (this.currentPage > 0) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }


  first() {
    this.pageChange.emit(0);
  }

}
