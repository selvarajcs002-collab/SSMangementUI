import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { DynamicToggleComponent, ToggleConfig } from '../../../shared/components/dynamic-toggle/dynamic-toggle.component';
import { filter } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, DynamicToggleComponent, SafeHtmlPipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  userPrefix = '';
  userName = '';
  userRole = 'Administrator';
  
  showToggle = false;
  showMenu = false;
  isDashboardHome = false;
  currentConfig: ToggleConfig | null = null;
  currentValue: string = '';

  menuItems = [
    {
      label: 'Dashboard',
      description: 'Main module selection',
      route: '/dashboard',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`
    },
    {
      label: 'Company',
      description: 'Company options',
      route: '/dashboard/company',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`
    },
    {
      label: 'Inward Entry',
      description: 'Add or update inward stock',
      route: '/dashboard/inward',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`
    },
    {
      label: 'Outward Entry',
      description: 'Create delivery challan',
      route: '/dashboard/outward',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>`
    },
    {
      label: 'Delivery Challan',
      description: 'Status and activity log',
      route: '/dashboard/delivery-challan',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`
    },
    {
      label: 'Add Company',
      description: 'Create company record',
      route: '/dashboard/company/add',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M9 10h6"/><path d="M12 7v6"/></svg>`
    },
    {
      label: 'Update Company',
      description: 'Edit company record',
      route: '/dashboard/company/update',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>`
    }
  ];

  private readonly CONFIGS: Record<string, ToggleConfig> = {
    company: {
      type: 'company',
      options: [
        { 
          label: 'Add', 
          value: 'add', 
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>` 
        },
        { 
          label: 'Update', 
          value: 'update', 
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>` 
        }
      ]
    },
    entry: {
      type: 'entry',
      options: [
        { 
          label: 'Inward Entry', 
          value: 'inward', 
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>` 
        },
        { 
          label: 'Outward Entry', 
          value: 'outward', 
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>` 
        }
      ]
    }
  };

  constructor(
    private router: Router, 
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateToggleState(event.urlAfterRedirects || event.url);
    });
    
    this.updateToggleState(this.router.url);
  }

  ngOnInit() {
    const email = localStorage.getItem('userEmail');
    if (email) {
      // Create a display name from the first part of the email
      const namePart = email.split('@')[0];
      // Capitalize the first letter
      this.userName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      // Use the first two letters as prefix
      this.userPrefix = this.userName.substring(0, 2).toUpperCase();
    } else {
      this.userName = 'User';
      this.userPrefix = 'US';
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showMenu) {
      this.closeMenu();
    }
  }

  private updateToggleState(url: string) {
    this.isDashboardHome = url === '/dashboard' || url === '/dashboard/';
    this.showMenu = false;

    if (url.includes('/dashboard/company')) {
      this.showToggle = true;
      this.currentConfig = this.CONFIGS['company'];
      if (url.includes('/update')) {
        this.currentValue = 'update';
      } else if (url.includes('/add')) {
        this.currentValue = 'add';
      } else {
        // On parent /company page, we might want to default or hide. 
        // For now, let's show 'add' as default or hide based on user preference.
        this.showToggle = true; 
        this.currentValue = ''; 
      }
    } else if (url.includes('/dashboard/inward') || url.includes('/dashboard/outward')) {
      this.showToggle = true;
      this.currentConfig = this.CONFIGS['entry'];
      this.currentValue = url.includes('/outward') ? 'outward' : 'inward';
    } else {
      this.showToggle = false;
    }
    
    this.cdr.markForCheck();
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
    this.cdr.markForCheck();
  }

  closeMenu(): void {
    this.showMenu = false;
    this.cdr.markForCheck();
  }

  handleToggleChange(value: string) {
    this.currentValue = value;
    
    if (this.currentConfig?.type === 'company') {
      if (value === 'add') {
        this.router.navigate(['/dashboard/company/add']);
      } else if (value === 'update') {
        this.router.navigate(['/dashboard/company/update']);
      }
    } else if (this.currentConfig?.type === 'entry') {
      if (value === 'inward') {
        this.router.navigate(['/dashboard/inward']);
      } else if (value === 'outward') {
        this.router.navigate(['/dashboard/outward']);
      }
    }
  }

  logout(): void {
    this.closeMenu();
    this.authService.logout();
  }
}
