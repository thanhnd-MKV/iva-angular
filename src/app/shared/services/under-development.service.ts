import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UnderDevelopmentDialogComponent, UnderDevelopmentData } from '../components/under-development-dialog/under-development-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class UnderDevelopmentService {

  constructor(private dialog: MatDialog) { }

  /**
   * Hiển thị popup thông báo tính năng đang phát triển
   * @param data Dữ liệu tùy chỉnh cho popup (title, message, features)
   */
  show(data?: UnderDevelopmentData): void {
    this.dialog.open(UnderDevelopmentDialogComponent, {
      data: data,
      width: '420px',
      maxWidth: '90vw',
      panelClass: 'under-development-dialog',
      autoFocus: false,
      disableClose: false
    });
  }

  /**
   * Hiển thị popup với thông tin mặc định
   */
  showDefault(): void {
    this.show();
  }

  /**
   * Hiển thị popup cho tính năng cụ thể
   * @param featureName Tên tính năng đang phát triển
   */
  showFeature(featureName: string): void {
    this.show({
      title: `${featureName} `,
      message: `Tính năng ${featureName} đang được phát triển và sẽ sớm ra mắt với đầy đủ chức năng.`,
      features: [
        'Giao diện thân thiện',
        'Hiệu suất tối ưu',
        'Dễ dàng sử dụng'
      ]
    });
  }
}
