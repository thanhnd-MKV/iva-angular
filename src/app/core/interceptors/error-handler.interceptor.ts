import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, map } from 'rxjs';
import { ErrorHandlerService } from '../services/error-handler.service';

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);
  
  console.log('🔍 HTTP Request intercepted:', req.method, req.url);
  
  return next(req).pipe(
    map((event: any) => {
      // Kiểm tra response body cho SSO login failed ngay cả khi HTTP status = 200
      if (event && event.body && typeof event.body === 'object') {
        console.log('� Response body check:', event.body);
        
        if ((event.body.code === "9998" || event.body.code === 9998) && event.body.success === false) {
          console.log('🔐 SSO Login failed detected in response! Triggering logout...');
          
          // Gọi trực tiếp method xử lý SSO logout
          errorHandler.handleSSOLogout(event.body, req);
          
          // Vẫn return response để component có thể handle
          return event;
        }
      }
      
      return event;
    }),
    catchError((error: HttpErrorResponse) => {
      console.log('❌ HTTP Error intercepted:', {
        status: error.status,
        url: req.url,
        error: error.error
      });
      
      // Bắt tất cả HTTP errors và xử lý tập trung
      errorHandler.handleHttpError(error, req);
      
      // Vẫn throw error để component có thể handle riêng nếu cần
      return throwError(() => error);
    })
  );
};