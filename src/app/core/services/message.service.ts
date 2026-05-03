import { Injectable, signal } from '@angular/core';

export interface AlertMessage {
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private alertSignal = signal<AlertMessage | null>(null);
  public alert = this.alertSignal.asReadonly();

  success(message: string) {
    this.alertSignal.set({ message, type: 'success' });
    this.autoClear();
  }

  error(message: string) {
    this.alertSignal.set({ message, type: 'error' });
    this.autoClear();
  }

  clear() {
    this.alertSignal.set(null);
  }

  private autoClear() {
    setTimeout(() => {
      this.clear();
    }, 5000);
  }
}
