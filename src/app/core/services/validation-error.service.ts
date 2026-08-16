import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationErrorService {
  private isOpenSignal = signal<boolean>(false);
  private errorListSignal = signal<string[]>([]);
  private titleSignal = signal<string>('Validation Error');

  isOpen = this.isOpenSignal.asReadonly();
  errorList = this.errorListSignal.asReadonly();
  title = this.titleSignal.asReadonly();

  show(message: string, title: string = 'Stock Level Alert'): void {
    // Basic delimiter handling: Split by | and trim
    const lines = message.split('|').map(line => line.trim()).filter(line => !!line);
    this.errorListSignal.set(lines);
    this.titleSignal.set(title);
    this.isOpenSignal.set(true);
  }

  close(): void {
    this.isOpenSignal.set(false);
    this.errorListSignal.set([]);
  }
}
