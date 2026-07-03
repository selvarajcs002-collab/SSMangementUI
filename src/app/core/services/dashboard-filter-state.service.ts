import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DashboardFilterState {
  companyId: string | number | null;
  styleNo: string | null;
  designName: string | null;
  colour: string | null;
  mode: 'S' | 'M' | 'ALL';
  fromDate: string | null;
  toDate: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardFilterStateService {
  private initialState: DashboardFilterState = {
    companyId: null,
    styleNo: null,
    designName: null,
    colour: null,
    mode: 'S',
    fromDate: this.getDefaultFromDate(),
    toDate: this.getDefaultToDate()
  };

  private stateSubject = new BehaviorSubject<DashboardFilterState>({ ...this.initialState });

  constructor() { }

  get state$(): Observable<DashboardFilterState> {
    return this.stateSubject.asObservable();
  }

  get currentState(): DashboardFilterState {
    return this.stateSubject.getValue();
  }

  updateState(newState: Partial<DashboardFilterState>): void {
    this.stateSubject.next({ ...this.currentState, ...newState });
  }

  resetState(): void {
    this.initialState.fromDate = this.getDefaultFromDate();
    this.initialState.toDate = this.getDefaultToDate();
    this.stateSubject.next({ ...this.initialState });
  }

  private getDefaultFromDate(): string {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return this.formatDate(firstDayOfMonth);
  }

  private getDefaultToDate(): string {
    const today = new Date();
    return this.formatDate(today);
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
}
