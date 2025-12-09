import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

interface Day {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  weekNumber: number; // Thêm số tuần
  isInSelectedWeek: boolean; // Thêm flag đánh dấu ngày trong tuần được chọn
}

interface WeekSelection {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-date-picker-week',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss']
})
export class DatePickerComponentWeek implements OnInit {
  @Output() weekSelected = new EventEmitter<WeekSelection>();
  
  isOpen = false;
  selectedWeek: WeekSelection | null = null;
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

  constructor(private elementRef: ElementRef, private datePipe: DatePipe) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
    
    // Tự động chọn tuần hiện tại khi khởi tạo
    this.setCurrentWeek();
    
    this.generateCalendar();
  }

  // Thêm method để set tuần hiện tại
  private setCurrentWeek(): void {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // Chuyển đổi để T2 là ngày đầu tuần
    
    // Tính ngày đầu tuần (Thứ 2)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    
    // Tính ngày cuối tuần (Chủ nhật)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Tính số tuần
    const getWeekNumber = (date: Date): number => {
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const firstDayOfWeek = firstDayOfMonth.getDay();
      const adjustedDay = (firstDayOfWeek + 6) % 7;
      const dayOfMonth = date.getDate();
      let weekNumber = Math.ceil((dayOfMonth + adjustedDay) / 7);
      if (adjustedDay >= 4) {
        weekNumber = Math.floor((dayOfMonth + adjustedDay - 1) / 7) + 1;
      }
      return weekNumber;
    };

    this.selectedWeek = {
      weekNumber: getWeekNumber(today),
      startDate: weekStart,
      endDate: weekEnd
    };

    // Emit event để parent component load data
    this.weekSelected.emit(this.selectedWeek);
    
    console.log('Default week set:', this.selectedWeek);
  }

  clearData(): void {
    this.selectedWeek = null;
    this.generateCalendar();
    // Emit null hoặc event để parent component biết data đã được clear
    this.weekSelected.emit({
      weekNumber: 0,
      startDate: new Date(),
      endDate: new Date()
    });
  }

  get formattedDate(): string {
    if (!this.selectedWeek) return '';
    const month = this.selectedWeek.startDate.getMonth() + 1;
    const year = this.selectedWeek.startDate.getFullYear();
    return `Tuần ${this.selectedWeek.weekNumber} - Tháng ${month}/${year}`;
  }

  toggleCalendar(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.displayDate = this.selectedWeek ? new Date(this.selectedWeek.startDate) : new Date();
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

    // Tính toán ngày đầu và cuối của tuần
    const selectedDate = new Date(day.date);
    const dayOfWeek = (selectedDate.getDay() + 6) % 7; // Chuyển đổi để T2 là ngày đầu tuần
    
    const weekStart = new Date(selectedDate);
    weekStart.setDate(selectedDate.getDate() - dayOfWeek);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    this.selectedWeek = {
      weekNumber: day.weekNumber,
      startDate: weekStart,
      endDate: weekEnd
    };

    this.generateCalendar();
    this.weekSelected.emit(this.selectedWeek);
    this.isOpen = false;
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

    // Tính tuần của tháng
    const getWeekNumber = (date: Date): number => {
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const firstDayOfWeek = firstDayOfMonth.getDay();
      
      // Điều chỉnh để thứ 2 là ngày đầu tuần (1-7)
      const adjustedDay = (firstDayOfWeek + 6) % 7;
      
      // Tính số ngày từ đầu tháng
      const dayOfMonth = date.getDate();
      
      // Tính tuần
      let weekNumber = Math.ceil((dayOfMonth + adjustedDay) / 7);
      
      // Nếu ngày đầu tháng rơi vào cuối tuần trước
      if (adjustedDay >= 4) {
        weekNumber = Math.floor((dayOfMonth + adjustedDay - 1) / 7) + 1;
      }
      
      return weekNumber;
    };

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      const isCurrentDisplayMonth = date.getMonth() === month;
      const weekNum = getWeekNumber(date);

      const isInSelectedWeek = this.selectedWeek ? 
        (date >= this.selectedWeek.startDate && date <= this.selectedWeek.endDate) : 
        false;

      const day: Day = {
        date: date,
        dayOfMonth: date.getDate(),
        isCurrentMonth: isCurrentDisplayMonth,
        isSelected: isInSelectedWeek,
        weekNumber: weekNum,
        isInSelectedWeek: isInSelectedWeek
      };

      this.days.push(day);
      startDate.setDate(startDate.getDate() + 1);
    }
  }

  toggleMonthDropdown(): void {
    this.showMonthDropdown = !this.showMonthDropdown;
    this.showYearDropdown = false;
  }

  toggleYearDropdown(): void {
    this.showYearDropdown = !this.showYearDropdown;
    this.showMonthDropdown = false;
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
