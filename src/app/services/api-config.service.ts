import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface AppSettings {
  apiUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  private settings$: Observable<AppSettings>;

  constructor(private http: HttpClient) {
    // Load the JSON file once at app start
    this.settings$ = this.http.get<AppSettings>('assets/appsettings.json');
  }

  /** Returns the base API URL as an observable */
  getApiUrl(): Observable<string> {
    return this.settings$.pipe(map(s => s.apiUrl));
  }
}
