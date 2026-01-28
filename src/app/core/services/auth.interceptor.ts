// auth.interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('TOKEN');

  if (token) {
    // Clone request with credentials and token header
    const clonedRequest = req.clone({
      setHeaders: {
        'sso-session-id': token,
      },
      withCredentials: true  // Enable credentials for CORS
    });

    return next(clonedRequest);
  }

  // Even without token, enable credentials for CORS
  const clonedRequest = req.clone({
    withCredentials: true
  });

  return next(clonedRequest);
};
