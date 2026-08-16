import { LogEntry } from '../models/log-entry.interface';

export class LoggerUtils {
  
  static generateErrorId(): string {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ERR-${dateStr}-${timeStr}-${randomNum}`;
  }

  static generateCorrelationId(): string {
    return `TRX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
  }

  static formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  static extractSourceDetails(error: any): { className: string; methodName: string; fileName: string; filePath: string; lineNumber: string; columnNumber: string } {
    let className = 'N/A';
    let methodName = 'N/A';
    let fileName = 'N/A';
    let filePath = 'N/A';
    let lineNumber = 'N/A';
    let columnNumber = 'N/A';

    if (error && error.stack) {
      const stackLines = error.stack.split('\n');
      // The first line is usually the error message, the second line is the origin.
      // E.g., 'at CustomerComponent.getCustomerDetails (src/app/customer/customer.component.ts:85:22)'
      for (let i = 1; i < stackLines.length; i++) {
        const line = stackLines[i].trim();
        if (line.startsWith('at ')) {
           const match = line.match(/at\s+([^\s]+)\s+\((.+?):(\d+):(\d+)\)/);
           if (match) {
             const classMethod = match[1].split('.');
             className = classMethod[0] || 'N/A';
             methodName = classMethod[1] || match[1];
             filePath = match[2] || 'N/A';
             fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'N/A';
             lineNumber = match[3] || 'N/A';
             columnNumber = match[4] || 'N/A';
             break;
           }
        }
      }
    }

    return { className, methodName, fileName, filePath, lineNumber, columnNumber };
  }

  static formatConsoleOutput(entry: LogEntry): string {
    const divider = '======================================================================';
    
    let output = `\n${divider}\n`;
    output += `LOG TYPE      : ${entry.logType}\n`;
    output += `ERROR ID      : ${entry.errorId || 'N/A'}\n`;
    output += `TIMESTAMP     : ${entry.timestamp}\n\n`;
    
    output += `APPLICATION   : ${entry.application}\n`;
    output += `ENVIRONMENT   : ${entry.environment}\n`;
    output += `VERSION       : ${entry.version}\n\n`;
    
    output += `## USER DETAILS\n\n`;
    output += `USER ID       : ${entry.userId || 'N/A'}\n`;
    output += `USER NAME     : ${entry.userName || 'N/A'}\n\n`;
    
    output += `## REQUEST DETAILS\n\n`;
    output += `URL           : ${entry.url || 'N/A'}\n`;
    output += `HTTP METHOD   : ${entry.httpMethod || 'N/A'}\n`;
    output += `CORRELATION ID: ${entry.correlationId || 'N/A'}\n\n`;
    
    output += `## SOURCE DETAILS\n\n`;
    output += `CLASS NAME    : ${entry.className || 'N/A'}\n`;
    output += `METHOD NAME   : ${entry.methodName || 'N/A'}\n`;
    output += `FILE NAME     : ${entry.fileName || 'N/A'}\n`;
    output += `FILE PATH     : ${entry.filePath || 'N/A'}\n`;
    output += `LINE NUMBER   : ${entry.lineNumber || 'N/A'}\n`;
    output += `COLUMN NUMBER : ${entry.columnNumber || 'N/A'}\n\n`;
    
    output += `## ERROR DETAILS\n\n`;
    output += `MESSAGE       : ${entry.message || 'N/A'}\n`;
    output += `ERROR TYPE    : ${entry.errorType || 'N/A'}\n`;
    output += `DESCRIPTION   : ${entry.description || 'N/A'}\n\n`;
    
    if (entry.stackTrace) {
      output += `## STACK TRACE\n\n`;
      output += `${entry.stackTrace}\n\n`;
    }
    
    if (entry.additionalData && Object.keys(entry.additionalData).length > 0) {
      output += `## ADDITIONAL DATA\n\n`;
      for (const [key, value] of Object.entries(entry.additionalData)) {
        output += `${key.padEnd(14)}: ${JSON.stringify(value)}\n`;
      }
      output += `\n`;
    }

    output += `${divider}\n`;
    return output;
  }
}
