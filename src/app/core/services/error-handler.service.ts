import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LogoutDialogComponent } from '../../shared/components/logout-dialog/logout-dialog.component';

export interface AppError {
  id: string;
  message: string;
  type: 'network' | 'server' | 'client' | 'timeout' | 'unknown';
  status: number;
  timestamp: Date;
  url?: string;
  method?: string;
  showSnackbar?: boolean;
  handled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errorsSubject = new BehaviorSubject<AppError[]>([]);
  private globalErrorSubject = new BehaviorSubject<AppError | null>(null);
  
  // Observable cho các component subscribe
  public errors$ = this.errorsSubject.asObservable();
  public globalError$ = this.globalErrorSubject.asObservable();

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Xử lý HTTP errors từ interceptor
   */
  handleHttpError(error: HttpErrorResponse, request?: HttpRequest<any>): AppError {
    const appError: AppError = {
      id: this.generateErrorId(),
      message: this.getErrorMessage(error),
      type: this.getErrorType(error),
      status: error.status,
      timestamp: new Date(),
      url: request?.url,
      method: request?.method,
      showSnackbar: this.shouldShowSnackbar(error),
      handled: false
    };

    // Kiểm tra SSO login failed và tự động logout
    if (this.isSSOLoginFailed(error)) {
      this.handleSSOLoginFailed(appError);
      return appError; // Return early để không xử lý error bình thường
    }

    // Thêm error vào danh sách
    this.addError(appError);

    // Set global error cho các component đang active
    this.setGlobalError(appError);

    // Hiển thị snackbar nếu cần
    if (appError.showSnackbar) {
      this.showErrorSnackbar(appError);
    }

    console.error('HTTP Error caught by interceptor:', {
      error: appError,
      originalError: error,
      request: request
    });

    return appError;
  }

  /**
   * Thêm error vào danh sách
   */
  private addError(error: AppError): void {
    const currentErrors = this.errorsSubject.value;
    const updatedErrors = [...currentErrors, error];
    
    // Giới hạn số lượng errors (giữ 50 errors gần nhất)
    if (updatedErrors.length > 50) {
      updatedErrors.splice(0, updatedErrors.length - 50);
    }
    
    this.errorsSubject.next(updatedErrors);
  }

  /**
   * Set global error cho component hiện tại
   */
  private setGlobalError(error: AppError): void {
    this.globalErrorSubject.next(error);
  }

  /**
   * Clear global error
   */
  clearGlobalError(): void {
    this.globalErrorSubject.next(null);
  }

  /**
   * Mark error as handled
   */
  markErrorAsHandled(errorId: string): void {
    const currentErrors = this.errorsSubject.value;
    const updatedErrors = currentErrors.map(error => 
      error.id === errorId ? { ...error, handled: true } : error
    );
    this.errorsSubject.next(updatedErrors);

    // Clear global error nếu đó là error hiện tại
    const currentGlobalError = this.globalErrorSubject.value;
    if (currentGlobalError?.id === errorId) {
      this.clearGlobalError();
    }
  }

  /**
   * Get error message dựa trên HTTP status
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    // Kiểm tra SSO login failed trước
    if (this.isSSOLoginFailed(error)) {
      return 'Phiên đăng nhập SSO đã hết hạn';
    }
    
    if (error.status === 0) {
      return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn.';
    } else if (error.status >= 500) {
      return 'Kiểm tra lại kết nối mạng với server. Vui lòng thử lại sau vài phút.';
    } else if (error.status === 404) {
      return 'Không tìm thấy dữ liệu yêu cầu.';
    } else if (error.status === 403) {
      return 'Bạn không có quyền truy cập dữ liệu này.';
    } else if (error.status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    } else if (error.status === 408) {
      return 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.';
    } else if (error.status >= 400 && error.status < 500) {
      return error.error?.message || 'Yêu cầu không hợp lệ.';
    } else {
      return error.error?.message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
    }
  }

  /**
   * Xác định loại error
   */
  private getErrorType(error: HttpErrorResponse): AppError['type'] {
    if (error.status === 0) {
      return 'network';
    } else if (error.status === 408) {
      return 'timeout';
    } else if (error.status >= 500) {
      return 'server';
    } else if (error.status >= 400) {
      return 'client';
    } else {
      return 'unknown';
    }
  }

  /**
   * Quyết định có hiển thị snackbar không
   */
  private shouldShowSnackbar(error: HttpErrorResponse): boolean {
    // Không hiển thị snackbar cho SSO login failed
    if (this.isSSOLoginFailed(error)) {
      return false;
    }
    
    // Không hiển thị snackbar cho một số trường hợp
    const silentErrors = [401]; // Unauthorized sẽ redirect to login
    return !silentErrors.includes(error.status);
  }

  /**
   * Hiển thị error snackbar
   */
  private showErrorSnackbar(error: AppError): void {
    const action = error.type === 'network' ? 'Thử lại' : 'Đóng';
    
    this.snackBar.open(error.message, action, {
      duration: error.type === 'network' ? 0 : 5000, // Network errors không tự đóng
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current errors
   */
  getCurrentErrors(): AppError[] {
    return this.errorsSubject.value;
  }

  /**
   * Get current global error
   */
  getCurrentGlobalError(): AppError | null {
    return this.globalErrorSubject.value;
  }

  /**
   * Clear all errors
   */
  clearAllErrors(): void {
    this.errorsSubject.next([]);
    this.clearGlobalError();
  }

  /**
   * Get unhandled errors
   */
  getUnhandledErrors(): AppError[] {
    return this.errorsSubject.value.filter(error => !error.handled);
  }

  /**
   * Manual error reporting (cho các lỗi không phải HTTP)
   */
  reportError(message: string, type: AppError['type'] = 'unknown', showSnackbar: boolean = true): AppError {
    const error: AppError = {
      id: this.generateErrorId(),
      message,
      type,
      status: 0,
      timestamp: new Date(),
      showSnackbar,
      handled: false
    };

    this.addError(error);
    this.setGlobalError(error);

    if (showSnackbar) {
      this.showErrorSnackbar(error);
    }

    return error;
  }

  /**
   * Xử lý SSO logout từ interceptor khi detect response có code 9998
   */
  handleSSOLogout(responseBody: any, request?: HttpRequest<any>): void {
    console.log('🔐 SSO Logout triggered from interceptor:', responseBody);
    
    const appError: AppError = {
      id: this.generateErrorId(),
      message: 'Phiên đăng nhập SSO đã hết hạn',
      type: 'client',
      status: 401,
      timestamp: new Date(),
      url: request?.url,
      method: request?.method,
      showSnackbar: false,
      handled: true
    };

    // Add to error list for logging
    this.addError(appError);
    
    // Thực hiện logout ngay lập tức
    this.performSSOLogout();
  }

  /**
   * Thực hiện SSO logout logic
   */
  private performSSOLogout(): void {
    console.warn('🔐 Performing SSO logout...');
    
    // Lấy token hiện tại trước khi clear
    const currentToken = sessionStorage.getItem('TOKEN');
    console.log('🔐 Current token before logout:', currentToken);
    
    // Hiển thị logout dialog
    const dialogRef = this.dialog.open(LogoutDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'Phiên đăng nhập hết hạn',
        message: 'Phiên SSO của bạn đã hết hạn. Hệ thống sẽ tự động đăng xuất và chuyển hướng đến trang đăng nhập SSO.',
        token: currentToken || 'Không có token',
        countdown: 100
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('🔐 Dialog result:', result);
      
      // Dù user chọn gì cũng thực hiện logout
      this.executeLogout(currentToken);
    });
  }

  /**
   * Thực hiện logout thực sự
   */
  private executeLogout(token: string | null): void {
    try {
      console.log('🔐 Executing logout with token:', token);
      
      // Clear toàn bộ session data
      sessionStorage.clear();
      localStorage.removeItem('LANG');
      
      console.log('🔐 Session cleared, calling authService.logout()...');
      
      // Gọi logout của AuthService để redirect về SSO
      this.authService.logout();
    } catch (logoutError) {
      console.error('Error during SSO logout:', logoutError);
      
      // Fallback: redirect về trang login local nếu SSO logout fail
      this.router.navigate(['/login']).catch(navError => {
        console.error('Navigation error:', navError);
        // Last resort: reload page
        window.location.reload();
      });
    }
  }

  /**
   * Kiểm tra xem có phải SSO login failed không (code 9998)
   */
  private isSSOLoginFailed(error: HttpErrorResponse): boolean {
    // Kiểm tra response body có chứa code "9998" và message "SSO Login failed"
    if (error.error) {
      const errorBody = error.error;
      return errorBody.code === "9998" || 
             errorBody.code === 9998 ||
             (errorBody.message && errorBody.message.includes("SSO Login failed"));
    }
    return false;
  }

  /**
   * Kiểm tra xem có phải SSO Code invalid không (code 9994)
   */
  isSSOCodeInvalid(error: any): boolean {
    if (error) {
      return error.code === "9994" || 
             error.code === 9994 ||
             (error.message && error.message.includes("SSO Code is invalid"));
    }
    return false;
  }

  /**
   * Xử lý SSO login failed - tự động logout và redirect về trang đăng nhập
   */
  private handleSSOLoginFailed(appError: AppError): void {
    console.warn('🔐 SSO Login failed detected, performing automatic logout...');
    
    // Mark error as handled để không hiển thị UI error
    appError.handled = true;
    appError.showSnackbar = false;
    
    // Add to error list for logging
    this.addError(appError);
    
    // Thực hiện logout
    this.performSSOLogout();
  }
}