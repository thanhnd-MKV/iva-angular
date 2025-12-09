import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ErrorHandlerService, AppError } from '../services/error-handler.service';

@Component({
  template: ''
})
export abstract class BaseErrorHandlerComponent implements OnInit, OnDestroy {
  protected destroy$ = new Subject<void>();
  protected errorHandler = inject(ErrorHandlerService);

  // Error state cho component
  hasError = false;
  errorMessage = '';
  currentError: AppError | null = null;

  ngOnInit(): void {
    // Clear any previous global errors when component initializes
    this.errorHandler.clearGlobalError();
    
    this.subscribeToGlobalErrors();
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    // Clear global error when component is destroyed
    this.errorHandler.clearGlobalError();
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to global errors
   */
  private subscribeToGlobalErrors(): void {
    this.errorHandler.globalError$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error && !error.handled) {
          this.handleGlobalError(error);
        } else {
          this.clearError();
        }
      });
  }

  /**
   * Handle global error - có thể override trong child components
   */
  protected handleGlobalError(error: AppError): void {
    this.hasError = true;
    this.errorMessage = error.message;
    this.currentError = error;
    
    console.log(`${this.constructor.name} handling global error:`, error);
  }

  /**
   * Clear error state
   */
  protected clearError(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.currentError = null;
  }

  /**
   * Mark current error as handled
   */
  protected markErrorAsHandled(): void {
    if (this.currentError) {
      this.errorHandler.markErrorAsHandled(this.currentError.id);
    }
    this.clearError();
  }

  /**
   * Retry action - override trong child components
   */
  protected abstract onRetry(): void;

  /**
   * Initialize component - override trong child components
   */
  protected abstract initializeComponent(): void;

  /**
   * Helper method để wrap service calls với error handling
   */
  protected handleServiceCall<T>(
    serviceCall: () => void,
    onSuccess?: (data: T) => void,
    onError?: (error: AppError) => void
  ): void {
    try {
      serviceCall();
    } catch (error) {
      const appError = this.errorHandler.reportError(
        'Đã xảy ra lỗi không mong muốn',
        'unknown',
        false
      );
      
      if (onError) {
        onError(appError);
      } else {
        this.handleGlobalError(appError);
      }
    }
  }
}