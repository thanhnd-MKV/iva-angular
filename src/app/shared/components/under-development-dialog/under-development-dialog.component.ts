import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

export interface UnderDevelopmentData {
  title?: string;
  message?: string;
  features?: string[];
}

@Component({
  selector: 'app-under-development-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './under-development-dialog.component.html',
  styleUrl: './under-development-dialog.component.css'
})
export class UnderDevelopmentDialogComponent {
  title: string;
  message: string;
  features: string[];

  constructor(
    public dialogRef: MatDialogRef<UnderDevelopmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnderDevelopmentData
  ) {
    this.title = data?.title || 'Tính Năng Đang Phát Triển';
    this.message = data?.message || 'Hệ thống thông báo đang được phát triển và sẽ sớm ra mắt với đầy đủ tính năng.';
    this.features = data?.features || [
      'Thông báo thời gian thực',
      'Cảnh báo sự kiện quan trọng',
      'Tùy chỉnh thông báo'
    ];
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
