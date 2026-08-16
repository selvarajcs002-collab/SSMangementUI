import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpInterceptor } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { MessageService } from '../../core/services/message.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private messageService: MessageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError(error => {
        console.error(error);
        this.messageService.error(error?.error?.message || 'Something went wrong');
        return throwError(() => error);
      })
    );
  }
}
