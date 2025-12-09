import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

interface Day {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
})
export class DatePickerComponent implements OnInit {
  isOpen = false;
  selectedDate: Date | null = new Date();
  displayDate: Date = new Date();

  days: Day[] = [];
  weekdays: string[] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  years: number[] = [];
  showMonthDropdown = false;
  showYearDropdown = false;

  popupPosition: 'top' | 'bottom' = 'bottom';

  @ViewChild('popupRef') popupRef!: ElementRef;
  @ViewChild('inputWrapperRef') inputWrapperRef!: ElementRef;
leftCalendarDate: any;
rightCalendarDate: any;

  constructor(private elementRef: ElementRef, private datePipe: DatePipe) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
    this.generateCalendar();
  }

  get formattedDate(): string {
    if (!this.selectedDate) return '';
    return this.datePipe.transform(this.selectedDate, 'dd-MM-yyyy') || '';
  }

  toggleCalendar(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.displayDate = this.selectedDate ? new Date(this.selectedDate) : new Date();
      this.generateCalendar();

      // Tính toán vị trí hiển thị popup
      setTimeout(() => {
        this.calculatePopupPosition();
      }, 0);
    }
  }

  calculatePopupPosition(): void {
    const inputRect = this.inputWrapperRef.nativeElement.getBoundingClientRect();
    const estimatedPopupHeight = 300;
    const margin = 8;

    if ((window.innerHeight - inputRect.bottom) < estimatedPopupHeight + margin) {
      this.popupPosition = 'top';
    } else {
      this.popupPosition = 'bottom';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }

    // Đóng dropdown tháng/năm nếu click ra ngoài
    if (
      !target.closest('.month-select') &&
      !target.closest('.year-select')
    ) {
      this.showMonthDropdown = false;
      this.showYearDropdown = false;
    }
  }

  selectDate(day: Day): void {
    if (!day.isCurrentMonth) {
      this.displayDate = new Date(day.date);
      this.generateCalendar();
      return;
    }

    this.selectedDate = day.date;
    this.isOpen = false;
    this.generateCalendar();
  }

  changeMonth(amount: number): void {
    this.displayDate.setMonth(this.displayDate.getMonth() + amount);
    this.displayDate = new Date(this.displayDate);
    this.generateCalendar();
  }

  generateCalendar(): void {
    this.days = [];
    const year = this.displayDate.getFullYear();
    const month = this.displayDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    let startDate = new Date(firstDayOfMonth);
    const dayOfWeek = (startDate.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - dayOfWeek);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      const isCurrentDisplayMonth = date.getMonth() === month;

      const day: Day = {
        date: date,
        dayOfMonth: date.getDate(),
        isCurrentMonth: isCurrentDisplayMonth,
        isSelected:
          !!this.selectedDate &&
          date.setHours(0, 0, 0, 0) ===
            new Date(this.selectedDate).setHours(0, 0, 0, 0) &&
          isCurrentDisplayMonth,
      };

      this.days.push(day);
      startDate.setDate(startDate.getDate() + 1);
    }
  }

  toggleMonthDropdown(): void {
    this.showMonthDropdown = !this.showMonthDropdown;
    this.showYearDropdown = false;
    
    // Scroll to current month when opening
    if (this.showMonthDropdown) {
      setTimeout(() => this.scrollToCurrentMonth(), 0);
    }
  }

  toggleYearDropdown(): void {
    this.showYearDropdown = !this.showYearDropdown;
    this.showMonthDropdown = false;
    
    // Scroll to current year when opening
    if (this.showYearDropdown) {
      setTimeout(() => this.scrollToCurrentYear(), 0);
    }
  }

  scrollToCurrentYear(): void {
    const currentYear = new Date().getFullYear();
    const yearElements = this.elementRef.nativeElement.querySelectorAll('.dropdown-year div');
    
    yearElements.forEach((el: HTMLElement) => {
      const yearText = el.textContent?.trim();
      if (yearText && parseInt(yearText) === currentYear) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // Scroll to current month in dropdown
  scrollToCurrentMonth(): void {
    const monthElements = this.elementRef.nativeElement.querySelectorAll('.dropdown div');
    
    monthElements.forEach((el: HTMLElement) => {
      if (el.classList.contains('current-month')) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  selectMonth(monthIndex: number): void {
    this.displayDate = new Date(this.displayDate.setMonth(monthIndex));
    this.generateCalendar();
    this.showMonthDropdown = false;
  }

  selectYear(year: number): void {
    this.displayDate = new Date(this.displayDate.setFullYear(year));
    this.generateCalendar();
    this.showYearDropdown = false;
  }
}
