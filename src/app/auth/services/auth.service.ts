import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { LoginRequest } from '../../core/models/request/login-request.model';
import { CommonResponse } from '../../core/models/response/common-response.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private api: ApiService, private router: Router) {}

  login(data: LoginRequest): Observable<CommonResponse> {
    return this.api.post<CommonResponse>(
      'login/login',
      data
    );
  }

  logout(): void {
    // Clear session and redirect to login
    localStorage.removeItem('userId');
    localStorage.removeItem('companyId');
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('userId');
  }

  // Helper patterns for login validation if needed within the component
  readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
}
