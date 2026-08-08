import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface Employee {
  id?: number;
  employeeId: string;
  fullName: string;
  gender: string;
  dob: string;
  mobileNumber: string;
  designation: string;
  joiningDate: string;
  monthlySalary: number;
  dailySalary: number;
  incentive: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface Attendance {
  attendanceId?: number;
  employeeId: string;
  fullName?: string;
  date: string;
  status: string;
  remarks?: string;
}

export interface Payroll {
  payrollId?: number;
  employeeId: string;
  fullName?: string;
  month: number;
  year: number;
  presentDays: number;
  dailySalary: number;
  incentive: number;
  totalSalary: number;
  isPaid?: boolean;
}

export interface RecentProductionEntry {
  productionNo: string;
  productionDate: string;
  employeeName: string;
  machineName: string;
  shift: string;
  totalProduction: number;
  targetProduction: number;
  status: string;
}

export interface DashboardSummary {
  yesterdayProduction: number;
  productionChangePercent: number;
  totalMachines: number;
  activeMachines: number;
  currentShiftName: string;
  currentShiftType: string;
  targetMetPercent: number;
  qcFailurePercent: number;
  recentProductionEntries: RecentProductionEntry[];
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  get apiUrl(): string {
    return `${this.configService.apiBaseUrl}/Employee`;
  }

  constructor(private http: HttpClient, private configService: AppConfigService) { }

  manageEmployee(employee: Employee): Observable<any> {
    return this.http.post(`${this.apiUrl}/manage`, employee);
  }

  getAllEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/all`);
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  saveAttendance(attendance: Attendance): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance`, attendance);
  }

  getAttendanceByDate(date: string): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.apiUrl}/attendance/${date}`);
  }

  getAttendanceByMonth(employeeId: string, date: string): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.apiUrl}/attendance/month/${employeeId}/${date}`);
  }

  generatePayroll(payroll: Payroll): Observable<any> {
    return this.http.post(`${this.apiUrl}/payroll`, payroll);
  }

  getPayrollByMonth(month: number, year: number): Observable<Payroll[]> {
    return this.http.get<Payroll[]>(`${this.apiUrl}/payroll/${month}/${year}`);
  }

  getPayrollSummary(month: number, year: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payroll/summary/${month}/${year}`);
  }

  // Shift Management
  assignShift(assignment: any): Observable<any> {
    return this.http.post(`${this.configService.apiBaseUrl}/Shift/assign`, assignment);
  }

  getShiftAssignments(date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.configService.apiBaseUrl}/Shift/assignments/${date}`);
  }

  getShifts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.configService.apiBaseUrl}/Shift/list`);
  }

  getMachines(): Observable<any[]> {
    return this.http.get<any[]>(`${this.configService.apiBaseUrl}/Shift/machines`);
  }

  getShiftSettings(): Observable<any> {
    return this.http.get<any>(`${this.configService.apiBaseUrl}/Shift/settings`);
  }

  saveMachine(machine: any): Observable<any> {
    return this.http.post<any>(`${this.configService.apiBaseUrl}/Shift/machines`, machine);
  }

  saveProduction(production: any): Observable<any> {
    return this.http.post<any>(`${this.configService.apiBaseUrl}/Production`, production);
  }

  getProductionLogs(params?: any): Observable<any> {
    let url = `${this.configService.apiBaseUrl}/Production/log?`;
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page) queryParams.append('page', params.page);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      if (params.search) queryParams.append('search', params.search);
      if (params.shift) queryParams.append('shift', params.shift);
      if (params.machineId) queryParams.append('machineId', params.machineId);
      if (params.status) queryParams.append('status', params.status);
      if (params.sortColumn) queryParams.append('sortColumn', params.sortColumn);
      if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    } else {
      queryParams.append('page', '1');
      queryParams.append('pageSize', '10');
    }
    return this.http.get<any>(`${url}${queryParams.toString()}`);
  }

  updateProduction(id: number, production: any): Observable<any> {
    return this.http.put<any>(`${this.configService.apiBaseUrl}/Production/${id}`, production);
  }

  deleteProduction(id: number): Observable<any> {
    return this.http.delete<any>(`${this.configService.apiBaseUrl}/Production/${id}`);
  }

  // Dashboard
  getDashboardStats(date: string): Observable<any> {
    return this.http.get<any>(`${this.configService.apiBaseUrl}/Dashboard/stats/${date}`);
  }

  getDynamicDashboard(): Observable<any> {
    return this.http.get<any>(`${this.configService.apiBaseUrl}/dashboard`);
  }

  getDashboardSummary(shift?: string): Observable<{ success: boolean; data: DashboardSummary }> {
    let url = `${this.configService.apiBaseUrl}/Dashboard/summary`;
    if (shift) {
      url += `?shift=${shift}`;
    }
    return this.http.get<{ success: boolean; data: DashboardSummary }>(url);
  }

  getRecentProductionLogs(): Observable<any> {
    return this.http.get<any>(`${this.configService.apiBaseUrl}/Production/log/recent`);
  }

  // Reports
  getPortalSummary(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.configService.apiBaseUrl}/Report/summary/${startDate}/${endDate}`);
  }

  getMasterData(type: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.configService.apiBaseUrl}/Master/list/${type}`);
  }
}
