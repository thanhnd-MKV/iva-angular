import { Component, ElementRef, HostListener, OnInit, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

interface Day {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss']
})
export class DateRangePickerComponent implements OnInit {
  isOpen = false;
  startDate: Date | null = null;
  endDate: Date | null = null;
  hoveredDate: Date | null = null;

  leftCalendarDate: Date = new Date();
  rightCalendarDate: Date = new Date();

  leftCalendarDays: Day[] = [];
  rightCalendarDays: Day[] = [];
  
  weekdays: string[] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  years: number[] = [];
  
  showLeftMonthDropdown = false;
  showLeftYearDropdown = false;
  
  showRightMonthDropdown = false;
  showRightYearDropdown = false;

  @Input() forceCompactMode: boolean = false;
  @Input() forceRightAlign: boolean = false;
  
  @Output() dateRangeSelected = new EventEmitter<{ startDate: Date, endDate: Date }>();
  @Output() dateRangeCleared = new EventEmitter<void>();

  @ViewChild('popupRef') popupRef!: ElementRef;
  @ViewChild('inputWrapperRef') inputWrapperRef!: ElementRef;

  // Popup positioning properties
  popupPosition: 'top' | 'bottom' = 'bottom';
  popupAlignment: 'left' | 'right' = 'left';
  useCompactMode: boolean = false;

  constructor(private elementRef: ElementRef, private datePipe: DatePipe) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 16 }, (_, i) => currentYear - 10 + i);
    this.updateCalendars();
  }

  toggleLeftMonthDropdown(): void {
    this.showLeftMonthDropdown = !this.showLeftMonthDropdown;
    this.showLeftYearDropdown = false;
    this.showRightMonthDropdown = false;
    this.showRightYearDropdown = false;
    
    // Scroll to current month when opening
    if (this.showLeftMonthDropdown) {
      setTimeout(() => this.scrollToCurrentMonth('left'), 0);
    }
  }

  toggleLeftYearDropdown(): void {
    this.showLeftYearDropdown = !this.showLeftYearDropdown;
    this.showLeftMonthDropdown = false;
    this.showRightMonthDropdown = false;
    this.showRightYearDropdown = false;
    
    // Scroll to current year when opening
    if (this.showLeftYearDropdown) {
      setTimeout(() => this.scrollToCurrentYear('left'), 0);
    }
  }

  selectLeftMonth(monthIndex: number): void {
    this.leftCalendarDate = new Date(this.leftCalendarDate.setMonth(monthIndex));
    this.updateCalendars();
    this.showLeftMonthDropdown = false;
  }

  selectLeftYear(year: number): void {
    this.leftCalendarDate = new Date(this.leftCalendarDate.setFullYear(year));
    this.updateCalendars();
    this.showLeftYearDropdown = false;
  }

  toggleRightMonthDropdown(): void {
    this.showRightMonthDropdown = !this.showRightMonthDropdown;
    this.showRightYearDropdown = false;
    this.showLeftMonthDropdown = false;
    this.showLeftYearDropdown = false;
    
    // Scroll to current month when opening
    if (this.showRightMonthDropdown) {
      setTimeout(() => this.scrollToCurrentMonth('right'), 0);
    }
  }

  clearData(): void {
    this.startDate = null;
    this.endDate = null;
    this.hoveredDate = null;
    
    // Emit event để parent component biết user đã clear date picker
    this.dateRangeCleared.emit();
  }

  toggleRightYearDropdown(): void {
    this.showRightYearDropdown = !this.showRightYearDropdown;
    this.showRightMonthDropdown = false;
    this.showLeftMonthDropdown = false;
    this.showLeftYearDropdown = false;
    
    // Scroll to current year when opening
    if (this.showRightYearDropdown) {
      setTimeout(() => this.scrollToCurrentYear('right'), 0);
    }
  }
  
  selectRightMonth(monthIndex: number): void {
    this.rightCalendarDate = new Date(this.rightCalendarDate.setMonth(monthIndex));
    const newLeftDate = new Date(this.rightCalendarDate);
    newLeftDate.setMonth(newLeftDate.getMonth() - 1);
    this.leftCalendarDate = newLeftDate;
    
    this.updateCalendars();
    this.showRightMonthDropdown = false;
  }

  selectRightYear(year: number): void {
    this.rightCalendarDate = new Date(this.rightCalendarDate.setFullYear(year));
    const newLeftDate = new Date(this.rightCalendarDate);
    newLeftDate.setMonth(newLeftDate.getMonth() - 1);
    this.leftCalendarDate = newLeftDate;

    this.updateCalendars();
    this.showRightYearDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
    
    if (!target.closest('.month-select') && !target.closest('.year-select')) {
      this.showLeftMonthDropdown = false;
      this.showLeftYearDropdown = false;
      this.showRightMonthDropdown = false;
      this.showRightYearDropdown = false;
    }
  }

  // Điều chỉnh format hiển thị ngày tháng
  get formattedDateRange(): string {
    if (!this.startDate) return '';
    const format = 'dd/MM/yyyy';
    if (!this.endDate) {
      return `${this.datePipe.transform(this.startDate, format)}`;
    }
    return `${this.datePipe.transform(this.startDate, format)} - ${this.datePipe.transform(this.endDate, format)}`;
  }

  toggleCalendar(): void {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
          this.leftCalendarDate = this.startDate ? new Date(this.startDate) : new Date();
          this.updateCalendars();
          setTimeout(() => this.calculatePopupPosition(), 0);
      }
  }

  confirmSelection(): void {
    if (this.startDate && this.endDate) {
      this.isOpen = false;
      this.dateRangeSelected.emit({ 
        startDate: this.startDate, 
        endDate: this.endDate 
      });
    }
  }

  // Calculate optimal popup position to prevent overflow
  calculatePopupPosition(): void {
    const inputRect = this.inputWrapperRef.nativeElement.getBoundingClientRect();
    const estimatedPopupHeight = 360;
    const estimatedPopupWidth = 540;
    const margin = 8;

    // Vertical positioning
    if ((window.innerHeight - inputRect.bottom) < estimatedPopupHeight + margin) {
      this.popupPosition = 'top';
    } else {
      this.popupPosition = 'bottom';
    }

    // Horizontal positioning - only change if would overflow
    if (this.forceRightAlign || (inputRect.left + estimatedPopupWidth + margin) > window.innerWidth) {
      this.popupAlignment = 'right';
    } else {
      this.popupAlignment = 'left';
    }

    // Compact mode - only when forced or on very small screens
    this.useCompactMode = this.forceCompactMode || window.innerWidth < 600;

    console.log('Popup position calculated:', {
      position: this.popupPosition,
      alignment: this.popupAlignment,
      compact: this.useCompactMode,
      inputRect,
      windowSize: { width: window.innerWidth, height: window.innerHeight }
    });
  }

  // Scroll to current year in dropdown
  scrollToCurrentYear(side: 'left' | 'right'): void {
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
  scrollToCurrentMonth(side: 'left' | 'right'): void {
    const currentMonth = side === 'left' ? this.leftCalendarDate.getMonth() : this.rightCalendarDate.getMonth();
    const monthElements = this.elementRef.nativeElement.querySelectorAll('.dropdown div');
    
    let index = 0;
    monthElements.forEach((el: HTMLElement) => {
      if (el.classList.contains('current-month')) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      index++;
    });
  }

  selectDate(day: Day): void {
      if (!day.isCurrentMonth) return;
      const clickedDate = day.date;
      if (!this.startDate || this.endDate) {
          this.startDate = clickedDate;
          this.endDate = null;
          this.hoveredDate = null;
      } else if (clickedDate < this.startDate) {
          this.startDate = clickedDate;
      } else {
          this.endDate = clickedDate;
          this.hoveredDate = null;
          // Don't close popup or emit event here
          // Wait for user to click "Xác nhận" button
      }
  }

  hoverDate(day: Day): void {
      if (this.startDate && !this.endDate && day.isCurrentMonth) {
          this.hoveredDate = day.date;
      }
  }

  changeMonth(amount: number): void {
      this.leftCalendarDate.setMonth(this.leftCalendarDate.getMonth() + amount);
      this.leftCalendarDate = new Date(this.leftCalendarDate);
      this.updateCalendars();
  }

  updateCalendars(): void {
      this.rightCalendarDate = new Date(this.leftCalendarDate);
      this.rightCalendarDate.setMonth(this.rightCalendarDate.getMonth() + 1);
      this.leftCalendarDays = this.generateCalendarDays(this.leftCalendarDate);
      this.rightCalendarDays = this.generateCalendarDays(this.rightCalendarDate);
  }

  generateCalendarDays(dateForMonth: Date): Day[] {
      const days: Day[] = [];
      const year = dateForMonth.getFullYear();
      const month = dateForMonth.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
      let currentDay = new Date(firstDayOfMonth);
      currentDay.setDate(currentDay.getDate() - dayOfWeek);
      for (let i = 0; i < 35; i++) {
          const date = new Date(currentDay);
          days.push({
              date: date,
              dayOfMonth: date.getDate(),
              isCurrentMonth: date.getMonth() === month,
          });
          currentDay.setDate(currentDay.getDate() + 1);
      }
      return days;
  }

  getDayClasses(day: Day): object { return { 'other-month': !day.isCurrentMonth, 'start-date': this.isSameDate(day.date, this.startDate), 'end-date': this.isSameDate(day.date, this.endDate), 'in-range': this.isInRange(day.date) }; }
  isSameDate(date1: Date | null, date2: Date | null): boolean { if (!date1 || !date2) return false; date1.setHours(0, 0, 0, 0); date2.setHours(0, 0, 0, 0); return date1.getTime() === date2.getTime(); }
  isInRange(date: Date): boolean { if (!this.startDate) return false; const targetDate = new Date(date); targetDate.setHours(0,0,0,0); const rangeStart = new Date(this.startDate); rangeStart.setHours(0,0,0,0); const rangeEnd = this.endDate ? new Date(this.endDate) : (this.hoveredDate ? new Date(this.hoveredDate) : null); if (!rangeEnd) return false; rangeEnd.setHours(0,0,0,0); const start = rangeStart < rangeEnd ? rangeStart : rangeEnd; const end = rangeStart < rangeEnd ? rangeEnd : rangeStart; return targetDate > start && targetDate < end; }
}