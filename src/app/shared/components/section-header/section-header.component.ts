import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SafeHtmlPipe],
  template: `
    <div class="section-header">
      <div class="header-top">
        <div class="title-wrapper">
          <span class="icon" *ngIf="icon" [innerHTML]="icon | safeHtml"></span>
          <h2 class="title">{{ title }}</h2>
        </div>
        
        <a *ngIf="actionRoute" [routerLink]="actionRoute" class="action-link">
          <span class="action-icon" *ngIf="actionIcon" [innerHTML]="actionIcon | safeHtml"></span>
          <span class="action-text">{{ actionText }}</span>
        </a>

        <button *ngIf="!actionRoute && actionText" (click)="actionClick.emit()" class="action-link btn-action">
          <span class="action-icon" *ngIf="actionIcon" [innerHTML]="actionIcon | safeHtml"></span>
          <span class="action-text">{{ actionText }}</span>
        </button>
      </div>
      <div class="divider"></div>
    </div>
  `,
  styles: [`
    .section-header {
      margin-top: 32px;
      margin-bottom: 24px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .title-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
    }

    .icon ::ng-deep svg {
      width: 20px;
      height: 20px;
      stroke-width: 2.5;
    }

    .title {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 0px;
    }

    .action-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      background: #EFF6FF;
      color: #2563EB;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s ease;
      border: 1px solid #DBEAFE;
      cursor: pointer;
    }

    .btn-action {
      outline: none;
      font-family: inherit;
    }

    .action-link:hover {
      background: #DBEAFE;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    .action-icon {
      display: flex;
      align-items: center;
    }

    .action-icon ::ng-deep svg {
      width: 16px;
      height: 16px;
      stroke-width: 2.5;
    }

    .divider {
      height: 1px;
      background: #F1F5F9;
      width: 100%;
    }
  `]
})
export class SectionHeaderComponent {
  @Input() title: string = '';
  @Input() icon: string | null = null;
  @Input() actionText: string = '';
  @Input() actionIcon: string | null = null;
  @Input() actionRoute: string | any[] | null = null;
  @Output() actionClick = new EventEmitter<void>();
}
