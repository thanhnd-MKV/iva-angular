import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nhan-dien-khuon-mat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h2>Nhận diện khuôn mặt</h2>
      <p>Nội dung trang Nhận diện khuôn mặt sẽ được phát triển ở đây.</p>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
    }
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 16px;
    }
    
    p {
      font-size: 14px;
      color: #6b7280;
    }
  `]
})
export class NhanDienKhuonMatComponent {}
