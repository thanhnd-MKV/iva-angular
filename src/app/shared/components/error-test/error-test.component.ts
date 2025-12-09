import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-test',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <div style="padding: 20px;">
      <h3>Test SSO Auto Logout</h3>
      
      <button mat-raised-button (click)="testSSO9998Error()" color="warn">
        Test SSO Login Failed (Code 9998)
      </button>
      
      <button mat-raised-button (click)="testNetworkError()" color="primary" style="margin-left: 10px;">
        Test Network Error
      </button>
      
      <button mat-raised-button (click)="testServerError()" color="accent" style="margin-left: 10px;">
        Test Server Error
      </button>
      
      <div style="margin-top: 20px;">
        <h4>Instructions:</h4>
        <ul>
          <li><strong>SSO Test</strong>: Should show warning snackbar and auto logout</li>
          <li><strong>Network Test</strong>: Should show error state in components</li>
          <li><strong>Server Test</strong>: Should show error state in components</li>
        </ul>
      </div>
    </div>
  `
})
export class ErrorTestComponent {
  constructor(private http: HttpClient) {}

  testSSO9998Error() {
    console.log('🧪 Testing SSO 9998 error...');
    
    // Tạo mock API call sẽ fail với SSO error
    this.http.post('/api/mock/sso-error', {
      // Mock payload
      test: 'sso-error'
    }).subscribe({
      next: (data) => {
        console.log('Unexpected success:', data);
      },
      error: (error) => {
        console.log('Expected SSO error caught:', error);
      }
    });
  }

  testNetworkError() {
    console.log('🧪 Testing network error...');
    
    // Call to non-existent endpoint
    this.http.get('http://localhost:99999/nonexistent').subscribe({
      next: (data) => {
        console.log('Unexpected success:', data);
      },
      error: (error) => {
        console.log('Expected network error caught:', error);
      }
    });
  }

  testServerError() {
    console.log('🧪 Testing server error...');
    
    // Call to endpoint that should return 500
    this.http.get('/api/mock/server-error').subscribe({
      next: (data) => {
        console.log('Unexpected success:', data);
      },
      error: (error) => {
        console.log('Expected server error caught:', error);
      }
    });
  }
}