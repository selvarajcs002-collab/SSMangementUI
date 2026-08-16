import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LogLevel } from '../models/log-level.enum';
import { LogEntry } from '../models/log-entry.interface';
import { LoggerUtils } from '../utils/logger.utils';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly apiUrl = '/api/logs'; // Configured API endpoint
  private readonly appName = 'DoorsUtility'; // Could be dynamic
  private readonly version = '1.0.0';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  info(className: string, methodName: string, message: string, error?: any, additionalData?: any): void {
    this.log(LogLevel.INFO, className, methodName, message, error, additionalData);
  }

  debug(className: string, methodName: string, message: string, error?: any, additionalData?: any): void {
    if (!environment.production) {
      this.log(LogLevel.DEBUG, className, methodName, message, error, additionalData);
    }
  }

  warning(className: string, methodName: string, message: string, error?: any, additionalData?: any): void {
    this.log(LogLevel.WARNING, className, methodName, message, error, additionalData);
  }

  error(className: string, methodName: string, message: string, error?: any, additionalData?: any): void {
    this.log(LogLevel.ERROR, className, methodName, message, error, additionalData);
  }

  fatal(className: string, methodName: string, message: string, error?: any, additionalData?: any): void {
    this.log(LogLevel.FATAL, className, methodName, message, error, additionalData);
  }

  private log(
    logType: LogLevel,
    className: string,
    methodName: string,
    message: string,
    errorObj?: any,
    additionalData?: any
  ): void {
    // Determine context safely
    const isBrowser = isPlatformBrowser(this.platformId);
    let url = 'N/A';
    if (isBrowser) {
      url = window.location.href;
    }

    // Mock User - Replace with actual AuthService
    const userId = 'EMP001';
    const userName = 'Selvaraj';

    let errorType = 'N/A';
    let description = 'N/A';
    let stackTrace = 'N/A';

    let extractedSource = { className, methodName, fileName: 'N/A', filePath: 'N/A', lineNumber: 'N/A', columnNumber: 'N/A' };

    if (errorObj) {
      if (errorObj instanceof Error) {
        errorType = errorObj.name;
        description = errorObj.message;
        stackTrace = errorObj.stack || 'N/A';
        extractedSource = LoggerUtils.extractSourceDetails(errorObj);
      } else if (errorObj instanceof HttpErrorResponse) {
         errorType = 'HttpErrorResponse';
         description = errorObj.message;
         url = errorObj.url || url;
      } else {
        errorType = 'UnknownError';
        description = typeof errorObj === 'string' ? errorObj : JSON.stringify(errorObj);
      }
    }

    // Attempt to merge caller details with extracted details if extracted were empty
    const finalClassName = extractedSource.className !== 'N/A' ? extractedSource.className : className;
    const finalMethodName = extractedSource.methodName !== 'N/A' ? extractedSource.methodName : methodName;

    const logEntry: LogEntry = {
      logType,
      errorId: logType === LogLevel.ERROR || logType === LogLevel.FATAL ? LoggerUtils.generateErrorId() : 'N/A',
      timestamp: LoggerUtils.formatTimestamp(new Date()),
      application: this.appName,
      environment: environment.production ? 'Production' : 'Development',
      version: this.version,
      userId,
      userName,
      url,
      httpMethod: additionalData?.httpMethod || 'N/A',
      correlationId: additionalData?.correlationId || 'N/A',
      className: finalClassName,
      methodName: finalMethodName,
      fileName: extractedSource.fileName,
      filePath: extractedSource.filePath,
      lineNumber: extractedSource.lineNumber,
      columnNumber: extractedSource.columnNumber,
      message,
      errorType,
      description,
      stackTrace,
      additionalData: additionalData || {}
    };

    this.printToConsole(logEntry);
    this.sendToServer(logEntry);
  }

  private printToConsole(entry: LogEntry): void {
    const formattedMessage = LoggerUtils.formatConsoleOutput(entry);

    switch (entry.logType) {
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.WARNING:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
        break;
    }
  }

  private sendToServer(entry: LogEntry): void {
    // API call disabled as per request to not use separate logs API
    /*
    this.http.post(this.apiUrl, entry)
      .pipe(
        catchError(err => {
          console.warn('Failed to send log to server:', err);
          return of(null);
        })
      )
      .subscribe();
    */
  }
}
