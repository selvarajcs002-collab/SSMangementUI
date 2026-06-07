import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/Employee`;

  constructor(private http: HttpClient) {}

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
    return this.http.post(`${environment.apiUrl}/Shift/assign`, assignment);
  }

  getShiftAssignments(date: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Shift/assignments/${date}`);
  }

  getShifts(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Shift/list`);
  }

  getMachines(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Shift/machines`);
  }

  getShiftSettings(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/Shift/settings`);
  }

  // Dashboard
  getDashboardStats(date: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/Dashboard/stats/${date}`);
  }

  // Reports
  getPortalSummary(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/Report/summary/${startDate}/${endDate}`);
  }

  getMasterData(type: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Master/list/${type}`);
  }
}
