import { ApplicationConfig } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { provideAnimations } from '@angular/platform-browser/animations';
import { appRoutes } from '../app/app.routes';
import { authInterceptor } from '../app/core/services/auth.interceptor';  
import { errorHandlerInterceptor } from '../app/core/interceptors/error-handler.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      appRoutes,
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      })
    ),
    provideAnimations(),
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorHandlerInterceptor  // Thêm error handler interceptor
      ])
    )
  ]
};
