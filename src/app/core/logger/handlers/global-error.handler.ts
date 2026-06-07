import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  
  // Using Injector to avoid cyclic dependency issues that might occur
  // if LoggerService injects HttpClient and HTTP_INTERCEPTORS are involved.
  constructor(private injector: Injector) {}

  handleError(error: Error | any): void {
    const loggerService = this.injector.get(LoggerService);
    
    // Determine if it's a fatal application error
    loggerService.fatal(
      'GlobalErrorHandler',
      'handleError',
      'Unhandled Application Exception Captured',
      error
    );

    // Re-throw if it's during development so the browser console still shows the raw error
    // or handled completely here depending on the requirement.
    console.error('An unexpected error occurred. See formatted log above.', error);
  }
}
