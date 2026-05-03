import { Injectable, signal } from '@angular/core';

export interface ModalConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private resolveFn: ((value: boolean) => void) | null = null;
  
  modalConfig = signal<ModalConfig | null>(null);
  isOpen = signal(false);

  showConfirmation(config: ModalConfig): Promise<boolean> {
    this.modalConfig.set(config);
    this.isOpen.set(true);
    
    return new Promise((resolve) => {
      this.resolveFn = resolve;
    });
  }

  confirm() {
    this.close(true);
  }

  cancel() {
    this.close(false);
  }

  private close(result: boolean) {
    this.isOpen.set(false);
    if (this.resolveFn) {
      this.resolveFn(result);
      this.resolveFn = null;
    }
  }
}
