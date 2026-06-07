import { Component, Injectable } from '@angular/core';
import { CanActivate, Resolve } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { LoggerService } from '../services/logger.service';
import { catchError } from 'rxjs/operators';

// ==========================================
// 1. COMPONENT USAGE EXAMPLE
// ==========================================
@Component({
  selector: 'app-logger-example',
  template: `<button (click)="simulateError()">Simulate Error</button>`
})
export class LoggerExampleComponent {
  constructor(private logger: LoggerService) {}

  ngOnInit(): void {
    this.logger.info('LoggerExampleComponent', 'ngOnInit', 'Component initialized');
    this.logger.debug('LoggerExampleComponent', 'ngOnInit', 'Debugging component state', undefined, { state: 'Initial' });
  }

  simulateError(): void {
    try {
      const obj: any = null;
      console.log(obj.missingProperty);
    } catch (error) {
      this.logger.error('LoggerExampleComponent', 'simulateError', 'Failed to read property', error, { customerId: 1001 });
    }
  }
}

// ==========================================
// 2. SERVICE USAGE EXAMPLE
// ==========================================
@Injectable({ providedIn: 'root' })
export class ExampleDataService {
  constructor(private logger: LoggerService) {}

  fetchData(): Observable<any> {
    this.logger.info('ExampleDataService', 'fetchData', 'Fetching data from API');
    
    // Simulate API call and error
    return throwError(() => new Error('Network timeout')).pipe(
      catchError(error => {
        this.logger.error('ExampleDataService', 'fetchData', 'Failed to fetch data', error);
        return of(null);
      })
    );
  }
}

// ==========================================
// 3. GUARD USAGE EXAMPLE
// ==========================================
@Injectable({ providedIn: 'root' })
export class AuthGuardExample implements CanActivate {
  constructor(private logger: LoggerService) {}

  canActivate(): boolean {
    const isAuthenticated = false; // Simulate check
    if (!isAuthenticated) {
      this.logger.warning('AuthGuardExample', 'canActivate', 'Unauthorized access attempt detected', undefined, { route: '/dashboard' });
      return false;
    }
    return true;
  }
}

// ==========================================
// 4. RESOLVER USAGE EXAMPLE
// ==========================================
@Injectable({ providedIn: 'root' })
export class DataResolverExample implements Resolve<any> {
  constructor(private logger: LoggerService) {}

  resolve(): Observable<any> {
    this.logger.info('DataResolverExample', 'resolve', 'Resolving data for route');
    return of({ data: 'Sample' });
  }
}
