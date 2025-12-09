import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-luu-luong-ra-vao',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h2>Lưu lượng ra vào</h2>
      <p>Nội dung trang Lưu lượng ra vào sẽ được phát triển ở đây.</p>
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
export class LuuLuongRaVaoComponent {}
