// auth.interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('TOKEN');

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        'sso-session-id': token,
      }
    });

    return next(clonedRequest);
  }

  return next(req); 
};
