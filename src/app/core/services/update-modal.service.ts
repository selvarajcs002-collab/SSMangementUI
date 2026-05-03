import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UpdateModalService {
  private isOpenSignal = signal(false);
  public isOpen = this.isOpenSignal.asReadonly();

  // New signal for sharing pre-fill data across routes and components
  private preFillDataSignal = signal<any>(null);
  public preFillData = this.preFillDataSignal.asReadonly();

  open() {
    this.isOpenSignal.set(true);
    document.body.classList.add('modal-open');
  }

  close() {
    this.isOpenSignal.set(false);
    document.body.classList.remove('modal-open');
  }

  setPreFillData(data: any) {
    this.preFillDataSignal.set(data);
  }

  clearPreFillData() {
    this.preFillDataSignal.set(null);
  }
}
