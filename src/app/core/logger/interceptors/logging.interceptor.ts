import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';
import { LoggerUtils } from '../utils/logger.utils';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {

  constructor(private logger: LoggerService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Exclude the logger API to avoid infinite loops
    if (request.url.includes('/api/logs')) {
      return next.handle(request);
    }

    const correlationId = LoggerUtils.generateCorrelationId();
    const clonedRequest = request.clone({
      headers: request.headers.set('X-Correlation-ID', correlationId)
    });

    const additionalData = {
      httpMethod: clonedRequest.method,
      correlationId: correlationId,
      requestUrl: clonedRequest.urlWithParams
    };

    // Log the Request
    this.logger.info(
      'LoggingInterceptor',
      'intercept',
      `Initiating HTTP ${clonedRequest.method} request to ${clonedRequest.url}`,
      undefined,
      additionalData
    );

    return next.handle(clonedRequest).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // Log the successful Response
          this.logger.info(
            'LoggingInterceptor',
            'intercept',
            `Received HTTP ${event.status} response from ${clonedRequest.url}`,
            undefined,
            { ...additionalData, status: event.status }
          );
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Log the failure
        this.logger.error(
          'LoggingInterceptor',
          'intercept',
          `HTTP Request failed for ${clonedRequest.url}`,
          error,
          { ...additionalData, status: error.status, statusText: error.statusText }
        );
        return throwError(() => error);
      })
    );
  }
}
