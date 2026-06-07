import { LogLevel } from './log-level.enum';

export interface LogEntry {
  // Common Details
  logType: LogLevel;
  errorId: string;
  timestamp: string; // ISO String format '2026-06-06 10:30:15.455'

  // Application Details
  application: string;
  environment: string;
  version: string;

  // User Details
  userId: string;
  userName: string;

  // Request Details
  url: string;
  httpMethod: string;
  correlationId: string;

  // Source Details
  className: string;
  methodName: string;
  fileName: string;
  filePath: string;
  lineNumber: string;
  columnNumber: string;

  // Error Details
  message: string;
  errorType: string;
  description: string;

  // Stack Trace
  stackTrace: string;

  // Additional Data
  additionalData: Record<string, any>;
}
