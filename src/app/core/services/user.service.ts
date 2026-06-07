import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UserRequest } from '../models/request/user-request.model';
import { CommonResponse } from '../models/response/common-response.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) {}

  saveUser(data: UserRequest): Observable<CommonResponse> {
    return this.api.post<CommonResponse>(
      'login/save-user',
      data
    );
  }

  updateUser(data: UserRequest): Observable<CommonResponse> {
    return this.api.put<CommonResponse>(
      'login/update-user',
      data
    );
  }
}
