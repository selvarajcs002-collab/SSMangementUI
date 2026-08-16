import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sub-page-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, SafeHtmlPipe],
  template: `
    <div class="sub-nav-wrapper">
      <div class="sub-nav-pill">
        <a *ngFor="let item of items" 
           [routerLink]="item.route" 
           routerLinkActive="active" 
           class="nav-item">
          <span class="nav-icon" [innerHTML]="item.icon | safeHtml"></span>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .sub-nav-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
      animation: fadeIn 0.4s ease-out;
    }

    .sub-nav-pill {
      display: flex;
      background: #F1F5F9;
      padding: 6px;
      border-radius: 40px;
      gap: 4px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
      border: 1px solid var(--border);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 24px;
      border-radius: 34px;
      text-decoration: none;
      color: var(--text-muted);
      font-size: 15px;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;

      &:hover:not(.active) {
        color: var(--text-main);
        background: rgba(0, 0, 0, 0.02);
      }

      &.active {
        background: #FFFFFF;
        color: var(--primary);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: scale(1.02);
      }

      .nav-icon {
        display: flex;
        align-items: center;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SubPageNavComponent {
  @Input() items: NavItem[] = [];
}
