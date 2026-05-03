import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './core/layout/header/header.component';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from './shared/components/confirmation-modal/confirmation-modal.component';
import { ModalService } from './core/services/modal.service';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { AlertComponent } from './shared/components/alert/alert.component';
import { MessageService } from './core/services/message.service';
import { UpdateModalComponent } from './shared/components/update-modal/update-modal.component';
import { UpdateModalService } from './core/services/update-modal.service';
import { ValidationErrorModalComponent } from './shared/components/validation-error-modal/validation-error-modal.component';
import { ValidationErrorService } from './core/services/validation-error.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CommonModule, ConfirmationModalComponent, LoaderComponent, AlertComponent, UpdateModalComponent, ValidationErrorModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('SSManagement');
  showHeader = signal(false);

  constructor(
    private router: Router,
    public modalService: ModalService,
    public updateModalService: UpdateModalService,
    public messageService: MessageService,
    public validationErrorService: ValidationErrorService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.showHeader.set(!url.includes('login') && !url.includes('signup'));
    });
  }

  ngOnInit() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
      if (window.location.pathname === '/login' || window.location.pathname === '/') {
        this.router.navigate(['/dashboard']);
      }
    } else {
      if (!window.location.pathname.includes('signup')) {
        this.router.navigate(['/login']);
      }
    }
  }
}
