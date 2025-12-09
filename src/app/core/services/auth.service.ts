import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  /**
   * Kiểm tra xem user đã đăng nhập hay chưa
   */
  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('user');
  }

  /**
   */
  getSSOCode(): string | null {
    return new URLSearchParams(window.location.search).get(environment.PARAM_NAME_SSO_CODE || 'sso_code');
  }

  /**
   * Check SSO code and login - trả về Observable để xử lý error
   */
  checkCodeAndLogin(): Observable<any> {
    const ssoCode = this.getSSOCode();
    if (!ssoCode) {
      console.warn('Thiếu sso_code trong URL');
      return throwError(() => ({
        code: '9995',
        message: 'Thiếu mã SSO trong URL',
        success: false
      }));
    }

    const url = `${environment.CHECKCODE_URL}?sso_code=${ssoCode}`;
    console.log('[SSO] Gửi yêu cầu checkCode:', url);

    return this.http.post<any>(url, {}, { withCredentials: true }).pipe(
      map((result) => {
        if (result.success) {
          const user = result.data;

          sessionStorage.setItem('user', JSON.stringify(user));
          sessionStorage.setItem('TOKEN', user.token);

          const tags = (user.permissions || []).map((p: any) => p.tag).filter(Boolean);
          sessionStorage.setItem('permissions', JSON.stringify(tags));

          console.log('[SSO] Đăng nhập thành công:', user);

          // Xóa sso_code khỏi URL
          window.history.replaceState({}, '', window.location.pathname);

          return result;
        } else {
          // Throw error nếu không thành công
          throw result;
        }
      }),
      catchError((err) => {
        console.error('[SSO] Lỗi khi gọi checkCode:', err);
        // Nếu có error.error thì là lỗi từ server
        if (err.error) {
          return throwError(() => err.error);
        }
        // Nếu không có error.error thì là lỗi từ result.success = false
        return throwError(() => err);
      })
    );
  }

  /**
   * @deprecated Sử dụng checkCodeAndLogin() thay vì
   */
  checkCodeAndLoginDeprecated(callback?: () => void): void {
    const ssoCode = this.getSSOCode();
    if (!ssoCode) {
      console.warn('Thiếu sso_code trong URL');
      return;
    }

    const url = `${environment.CHECKCODE_URL}?sso_code=${ssoCode}`;
    console.log('[SSO] Gửi yêu cầu checkCode:', url);

    this.http.post<any>(url, {}, { withCredentials: true }).subscribe({
      next: (result) => {
        if (result.success) {
          const user = result.data;

          sessionStorage.setItem('user', JSON.stringify(user));
          sessionStorage.setItem('TOKEN', user.token);

          const tags = (user.permissions || []).map((p: any) => p.tag).filter(Boolean);
          sessionStorage.setItem('permissions', JSON.stringify(tags));

          console.log('[SSO] Đăng nhập thành công:', user);

          window.history.replaceState({}, '', window.location.pathname);

          callback?.();
        } else {
          // alert('Đăng nhập thất bại: ' + result.message);
          console.log('[SSO] Đăng nhập thất bại:', result.message);
        }
      },
      error: (err) => {
        console.error('[SSO] Lỗi khi gọi checkCode:', err);
      }
    });
  }


  /**
   */
  loginSSO(): void {
    const redirectUrl = `${environment.APP_SERVER}/login`; // prd
    const ssoLoginUrl = `${environment.SSO_SERVER}${environment.SSO_SERVER_URL_PREFIX}/login?redirect_url=${redirectUrl}`;
    window.location.href = ssoLoginUrl;
  }

  /**
   */
  logout(): void {
    console.log('🔐 AuthService.logout() called');
    
    let oldToken = sessionStorage.getItem('TOKEN');
    console.log('🔐 Token at logout time:', oldToken);
    
    if (!oldToken) {
      console.warn('🔐 No token found for logout');
      oldToken = 'no-token';
    }
    
    // Note: Session đã được clear bởi ErrorHandlerService
    console.log('🔐 Building logout URL...');
    
    let logout_url = '/sso/logout?sso-session-id=' + oldToken;
    console.log('🔐 Final logout URL:', logout_url);
    
    // Redirect to SSO logout
    console.log('🔐 Redirecting to SSO logout...');
    window.location.href = logout_url;
  }
}
